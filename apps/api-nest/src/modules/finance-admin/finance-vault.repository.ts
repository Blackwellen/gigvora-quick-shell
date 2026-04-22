/**
 * Repository for the encrypted bank-details vault, FCA-safe reveal audit,
 * and the double-entry ledger. All raw SQL against the user's own Postgres.
 */
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { EncField } from './finance-vault.crypto';

export interface BankRow {
  id: string;
  owner_id: string;
  owner_kind: 'user' | 'company' | 'admin' | 'platform';
  display_label: string;
  country: string;
  currency: string;
  account_holder_name: string;
  account_last4: string;
  fingerprint: string;
  key_version: number;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankCreateIn {
  ownerId: string;
  ownerKind: 'user' | 'company' | 'admin' | 'platform';
  displayLabel: string;
  country: string;
  currency: string;
  accountHolderName: string;
  accountNumber: EncField;
  sortOrRouting: EncField;
  iban?: EncField;
  swiftBic?: string;
  last4: string;
  fingerprint: string;
  keyVersion: number;
  createdBy: string;
}

export interface RevealEventIn {
  bankId: string;
  actorId: string;
  actorRole: string;
  reason: string;
  fieldsRevealed: string[];
  ip?: string;
  ua?: string;
  sessionId?: string;
}

export interface JournalLineIn {
  accountId: string;
  amountMinor: number;     // always positive; `side` controls sign
  currency: string;
  side: 'debit' | 'credit';
  memo?: string;
}

export interface JournalEntryIn {
  kind: string;
  reference: string;
  externalRef?: string;
  memo?: string;
  postedBy?: string;
  meta?: Record<string, unknown>;
  lines: JournalLineIn[];
}

@Injectable()
export class FinanceVaultRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Vault ──────────────────────────────────────────────
  async listVault(ownerKind?: string, ownerId?: string): Promise<BankRow[]> {
    const where: string[] = ['archived_at IS NULL'];
    const params: any[] = [];
    if (ownerKind) { params.push(ownerKind); where.push(`owner_kind = $${params.length}`); }
    if (ownerId)   { params.push(ownerId);   where.push(`owner_id   = $${params.length}`); }
    return this.ds.query(
      `SELECT id, owner_id, owner_kind, display_label, country, currency,
              account_holder_name, account_last4, fingerprint, key_version,
              verified, verified_at, created_at, updated_at
       FROM bank_details_vault
       WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC`, params,
    );
  }

  async getVaultRecord(id: string): Promise<BankRow | null> {
    const r = await this.ds.query(
      `SELECT id, owner_id, owner_kind, display_label, country, currency,
              account_holder_name, account_last4, fingerprint, key_version,
              verified, verified_at, created_at, updated_at
       FROM bank_details_vault WHERE id = $1 AND archived_at IS NULL`, [id]);
    return r[0] ?? null;
  }

  async findByFingerprint(ownerKind: string, ownerId: string, fp: string): Promise<BankRow | null> {
    const r = await this.ds.query(
      `SELECT id, owner_id, owner_kind, display_label, country, currency,
              account_holder_name, account_last4, fingerprint, key_version,
              verified, verified_at, created_at, updated_at
       FROM bank_details_vault
       WHERE owner_kind = $1 AND owner_id = $2 AND fingerprint = $3
         AND archived_at IS NULL`, [ownerKind, ownerId, fp]);
    return r[0] ?? null;
  }

  async insertVault(b: BankCreateIn): Promise<BankRow> {
    const r = await this.ds.query(
      `INSERT INTO bank_details_vault
        (owner_id, owner_kind, display_label, country, currency,
         account_holder_name,
         account_number_cipher,  account_number_iv,  account_number_tag,
         sort_or_routing_cipher, sort_or_routing_iv, sort_or_routing_tag,
         iban_cipher, iban_iv, iban_tag, swift_bic,
         account_last4, fingerprint, key_version)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id, owner_id, owner_kind, display_label, country, currency,
                 account_holder_name, account_last4, fingerprint, key_version,
                 verified, verified_at, created_at, updated_at`,
      [b.ownerId, b.ownerKind, b.displayLabel, b.country, b.currency,
       b.accountHolderName,
       b.accountNumber.ciphertext, b.accountNumber.iv, b.accountNumber.tag,
       b.sortOrRouting.ciphertext, b.sortOrRouting.iv, b.sortOrRouting.tag,
       b.iban?.ciphertext ?? null, b.iban?.iv ?? null, b.iban?.tag ?? null,
       b.swiftBic ?? null,
       b.last4, b.fingerprint, b.keyVersion],
    );
    return r[0];
  }

  async getCipherFields(id: string): Promise<{
    accountNumber: EncField; sortOrRouting: EncField; iban: EncField | null; swiftBic: string | null;
  } | null> {
    const r = await this.ds.query(
      `SELECT account_number_cipher  AS "anc", account_number_iv  AS "ani", account_number_tag  AS "ant",
              sort_or_routing_cipher AS "src", sort_or_routing_iv AS "sri", sort_or_routing_tag AS "srt",
              iban_cipher AS "ic", iban_iv AS "ii", iban_tag AS "it", swift_bic AS "sb"
       FROM bank_details_vault WHERE id = $1 AND archived_at IS NULL`, [id]);
    const row = r[0];
    if (!row) return null;
    return {
      accountNumber: { ciphertext: row.anc, iv: row.ani, tag: row.ant },
      sortOrRouting: { ciphertext: row.src, iv: row.sri, tag: row.srt },
      iban: row.ic ? { ciphertext: row.ic, iv: row.ii, tag: row.it } : null,
      swiftBic: row.sb,
    };
  }

  async archiveVault(id: string): Promise<void> {
    await this.ds.query(`UPDATE bank_details_vault SET archived_at = now() WHERE id = $1`, [id]);
  }

  async setVerified(id: string, actorId: string): Promise<void> {
    await this.ds.query(
      `UPDATE bank_details_vault SET verified = true, verified_at = now(), verified_by = $2 WHERE id = $1`,
      [id, actorId],
    );
  }

  async insertReveal(e: RevealEventIn): Promise<void> {
    await this.ds.query(
      `INSERT INTO bank_details_reveal_events
        (bank_id, actor_id, actor_role, reason, fields_revealed, ip, user_agent, session_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [e.bankId, e.actorId, e.actorRole, e.reason, e.fieldsRevealed,
       e.ip ?? null, e.ua ?? null, e.sessionId ?? null],
    );
  }

  async listReveals(bankId: string, limit = 50) {
    return this.ds.query(
      `SELECT id, actor_id, actor_role, reason, fields_revealed, ip, user_agent, session_id, created_at
       FROM bank_details_reveal_events WHERE bank_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [bankId, limit],
    );
  }

  // ── Ledger ─────────────────────────────────────────────
  async upsertAccount(ownerKind: string, ownerId: string | null, bucket: string, currency = 'GBP') {
    const r = await this.ds.query(
      `INSERT INTO ledger_accounts (owner_id, owner_kind, bucket, currency)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (owner_kind, owner_id, bucket, currency) DO UPDATE SET bucket = EXCLUDED.bucket
       RETURNING id, owner_id, owner_kind, bucket, currency, balance_minor`,
      [ownerId, ownerKind, bucket, currency],
    );
    return r[0];
  }

  async listAccounts(ownerKind?: string, ownerId?: string) {
    const where: string[] = [];
    const params: any[] = [];
    if (ownerKind) { params.push(ownerKind); where.push(`owner_kind = $${params.length}`); }
    if (ownerId)   { params.push(ownerId);   where.push(`owner_id   = $${params.length}`); }
    return this.ds.query(
      `SELECT id, owner_id, owner_kind, bucket, currency, balance_minor, created_at
       FROM ledger_accounts ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY owner_kind, bucket`, params,
    );
  }

  async postEntry(entry: JournalEntryIn) {
    return this.ds.transaction(async (m) => {
      const head = await m.query(
        `INSERT INTO ledger_journal_entries (kind, reference, external_ref, memo, posted_by, meta)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING id, posted_at`,
        [entry.kind, entry.reference, entry.externalRef ?? null, entry.memo ?? null,
         entry.postedBy ?? null, JSON.stringify(entry.meta ?? {})],
      );
      const entryId = head[0].id;
      for (const ln of entry.lines) {
        await m.query(
          `INSERT INTO ledger_journal_lines (entry_id, account_id, amount_minor, currency, side, memo)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [entryId, ln.accountId, ln.amountMinor, ln.currency, ln.side, ln.memo ?? null],
        );
      }
      return { id: entryId, postedAt: head[0].posted_at };
    });
  }

  async entryByReference(reference: string) {
    const r = await this.ds.query(
      `SELECT id, kind, reference, external_ref, memo, posted_at
       FROM ledger_journal_entries WHERE reference = $1`, [reference]);
    return r[0] ?? null;
  }

  async recentEntries(limit = 100) {
    return this.ds.query(
      `SELECT e.id, e.kind, e.reference, e.external_ref, e.memo, e.posted_at,
              COALESCE(json_agg(json_build_object(
                'accountId', l.account_id, 'amount_minor', l.amount_minor,
                'currency', l.currency, 'side', l.side, 'memo', l.memo
              ) ORDER BY l.id) FILTER (WHERE l.id IS NOT NULL), '[]'::json) AS lines
       FROM ledger_journal_entries e
       LEFT JOIN ledger_journal_lines l ON l.entry_id = e.id
       GROUP BY e.id ORDER BY e.posted_at DESC LIMIT $1`, [limit]);
  }

  async balanceTrial() {
    return this.ds.query(
      `SELECT bucket, currency, SUM(balance_minor)::bigint AS total_minor, COUNT(*) AS accounts
       FROM ledger_accounts GROUP BY bucket, currency ORDER BY bucket`,
    );
  }
}
