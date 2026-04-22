/**
 * FinanceVaultService — enterprise-grade backbone for FD-16 finance closure:
 *   • Encrypted bank-details vault (AES-256-GCM envelope encryption)
 *   • FCA-safe reveal audit (append-only, 4-500 char reason required)
 *   • Double-entry ledger with held-credits / commission / ad-spend buckets
 *   • Bucket-separated postings: charge → escrow → release → commission accrue
 *
 * Security:
 *   • Vault writes & reveals require `fin_admin` or `super_admin` role
 *   • Reveal returns plaintext exactly once; full audit row is written first
 *   • Duplicate-account guard via deterministic fingerprint
 *   • Ledger postings are atomic; balance enforcement is in the DB trigger
 */
import { ForbiddenException, Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { FinanceVaultRepository, JournalEntryIn } from './finance-vault.repository';
import { sealField, openField, fingerprintAccount, last4, KEY_VERSION } from './finance-vault.crypto';

const FIN_WRITE_ROLES = new Set(['fin_admin', 'super_admin']);
const FIN_READ_ROLES  = new Set(['fin_admin', 'super_admin', 'fin_viewer', 'auditor']);
const FIN_REVEAL_ROLES = new Set(['fin_admin', 'super_admin']);

function canWrite(role: string)  { return FIN_WRITE_ROLES.has(role); }
function canRead(role: string)   { return FIN_READ_ROLES.has(role); }
function canReveal(role: string) { return FIN_REVEAL_ROLES.has(role); }

export const BankCreateSchema = z.object({
  ownerId: z.string().uuid(),
  ownerKind: z.enum(['user', 'company', 'admin', 'platform']),
  displayLabel: z.string().min(1).max(120),
  country: z.string().length(2),
  currency: z.string().length(3).default('GBP'),
  accountHolderName: z.string().min(1).max(200),
  accountNumber: z.string().min(4).max(34),
  sortOrRouting: z.string().min(4).max(34),
  iban: z.string().min(15).max(34).optional(),
  swiftBic: z.string().min(8).max(11).optional(),
});

export const RevealSchema = z.object({
  reason: z.string().min(4).max(500),
  fields: z.array(z.enum(['account_number', 'sort_or_routing', 'iban', 'swift_bic'])).min(1),
});

@Injectable()
export class FinanceVaultService {
  private readonly log = new Logger(FinanceVaultService.name);

  constructor(private readonly repo: FinanceVaultRepository) {}

  // ── Bank vault ─────────────────────────────────────────
  async listBankVault(role: string, ownerKind?: string, ownerId?: string) {
    if (!canRead(role)) throw new ForbiddenException('finance role required');
    return this.repo.listVault(ownerKind, ownerId);
  }

  async createBankRecord(role: string, actorId: string, body: z.infer<typeof BankCreateSchema>) {
    if (!canWrite(role)) throw new ForbiddenException('fin_admin or super_admin required');
    const parsed = BankCreateSchema.parse(body);
    const fp = fingerprintAccount(parsed.accountNumber);

    const dup = await this.repo.findByFingerprint(parsed.ownerKind, parsed.ownerId, fp);
    if (dup) throw new ConflictException(`account already vaulted as ${dup.id}`);

    const created = await this.repo.insertVault({
      ownerId: parsed.ownerId,
      ownerKind: parsed.ownerKind,
      displayLabel: parsed.displayLabel,
      country: parsed.country,
      currency: parsed.currency,
      accountHolderName: parsed.accountHolderName,
      accountNumber:  sealField(parsed.accountNumber),
      sortOrRouting:  sealField(parsed.sortOrRouting),
      iban: parsed.iban ? sealField(parsed.iban) : undefined,
      swiftBic: parsed.swiftBic,
      last4: last4(parsed.accountNumber),
      fingerprint: fp,
      keyVersion: KEY_VERSION,
      createdBy: actorId,
    });
    this.log.log(`bank vault create id=${created.id} owner=${parsed.ownerKind}:${parsed.ownerId} fp=${fp.slice(0, 8)}`);
    return created;
  }

  async revealBankRecord(role: string, actorId: string, bankId: string,
                         body: z.infer<typeof RevealSchema>,
                         ip?: string, ua?: string, sessionId?: string) {
    if (!canReveal(role)) throw new ForbiddenException('fin_admin or super_admin required to reveal PII');
    const parsed = RevealSchema.parse(body);
    const head = await this.repo.getVaultRecord(bankId);
    if (!head) throw new NotFoundException('bank record not found');
    const ciphers = await this.repo.getCipherFields(bankId);
    if (!ciphers) throw new NotFoundException('bank record not found');

    // Audit row FIRST so the reveal is provably logged before plaintext touches the wire
    await this.repo.insertReveal({
      bankId, actorId, actorRole: role,
      reason: parsed.reason, fieldsRevealed: parsed.fields,
      ip, ua, sessionId,
    });

    const out: Record<string, string | null> = {};
    if (parsed.fields.includes('account_number'))  out.account_number  = openField(ciphers.accountNumber);
    if (parsed.fields.includes('sort_or_routing')) out.sort_or_routing = openField(ciphers.sortOrRouting);
    if (parsed.fields.includes('iban'))            out.iban            = ciphers.iban ? openField(ciphers.iban) : null;
    if (parsed.fields.includes('swift_bic'))       out.swift_bic       = ciphers.swiftBic;
    return { id: bankId, last4: head.account_last4, revealed: out, audited: true };
  }

  async revealHistory(role: string, bankId: string) {
    if (!canRead(role)) throw new ForbiddenException('finance role required');
    return this.repo.listReveals(bankId);
  }

  async verifyBankRecord(role: string, actorId: string, bankId: string) {
    if (!canWrite(role)) throw new ForbiddenException('fin_admin or super_admin required');
    await this.repo.setVerified(bankId, actorId);
    return { ok: true };
  }

  async archiveBankRecord(role: string, bankId: string) {
    if (!canWrite(role)) throw new ForbiddenException('fin_admin or super_admin required');
    await this.repo.archiveVault(bankId);
    return { ok: true };
  }

  // ── Ledger ─────────────────────────────────────────────
  async listAccounts(role: string, ownerKind?: string, ownerId?: string) {
    if (!canRead(role)) throw new ForbiddenException('finance role required');
    return this.repo.listAccounts(ownerKind, ownerId);
  }

  async ensureAccount(role: string, ownerKind: string, ownerId: string | null, bucket: string, currency = 'GBP') {
    if (!canWrite(role)) throw new ForbiddenException('fin_admin or super_admin required');
    return this.repo.upsertAccount(ownerKind, ownerId, bucket, currency);
  }

  async postEntry(role: string, actorId: string, entry: JournalEntryIn) {
    if (!canWrite(role)) throw new ForbiddenException('fin_admin or super_admin required');
    if (!entry.lines || entry.lines.length < 2) throw new BadRequestException('entry needs at least 2 lines');
    const debits  = entry.lines.filter(l => l.side === 'debit').reduce((s, l) => s + l.amountMinor, 0);
    const credits = entry.lines.filter(l => l.side === 'credit').reduce((s, l) => s + l.amountMinor, 0);
    if (debits !== credits) throw new BadRequestException(`unbalanced: debit=${debits} credit=${credits}`);
    const existing = await this.repo.entryByReference(entry.reference);
    if (existing) return { id: existing.id, postedAt: existing.posted_at, idempotent: true };
    const head = await this.repo.postEntry({ ...entry, postedBy: actorId });
    return { ...head, idempotent: false };
  }

  async recentEntries(role: string) {
    if (!canRead(role)) throw new ForbiddenException('finance role required');
    return this.repo.recentEntries();
  }

  async trialBalance(role: string) {
    if (!canRead(role)) throw new ForbiddenException('finance role required');
    return this.repo.balanceTrial();
  }
}
