/**
 * FD-17 service — master settings + legal/consent + KPIs + entitlements +
 * internal role lifecycle + kill-switch matrix.
 *
 * Storage strategy: this service speaks to the existing settings repo
 * (`packages/db/src/schema/settings.ts`) plus four new tables created by
 * `packages/db/migrations/0083_master_settings_backbone.sql`:
 *   - master_settings_entries
 *   - master_settings_pending_changes
 *   - master_legal_docs / master_consent_ledger
 *   - master_kpi_definitions / master_kpi_snapshots
 *   - master_portal_entitlements
 *   - master_internal_accounts
 *   - master_kill_switches
 *
 * The data layer is intentionally a thin port; this service does the
 * real work — role gating, two-person rule, envelope encryption, and audit.
 */
import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  TWO_PERSON_NAMESPACES, SECRET_NAMESPACES,
  type SettingsNamespace, type SettingsEnvironment, type AdminRole,
  type KillSwitchDomain,
} from './master-settings.types';
import { sealSecret, viewSecret, type SecretEnvelope } from './master-settings.crypto';
import { MasterSettingsRepo } from './master-settings.repo';
import { SuperAdminAuditService } from '../super-admin-command-center/audit.service';

type Actor = { id: string; role: AdminRole; ip?: string };

const READ_ROLES: AdminRole[] = ['viewer', 'sa_operator', 'sa_admin', 'sa_root'];
const WRITE_ROLES: AdminRole[] = ['sa_operator', 'sa_admin', 'sa_root'];
const ADMIN_PLUS: AdminRole[] = ['sa_admin', 'sa_root'];
const ROOT_ONLY: AdminRole[] = ['sa_root'];

function ensure(role: AdminRole, allow: AdminRole[]) {
  if (!allow.includes(role)) throw new ForbiddenException(`role ${role} not allowed`);
}

@Injectable()
export class MasterSettingsService {
  constructor(
    private readonly repo: MasterSettingsRepo,
    private readonly audit: SuperAdminAuditService,
  ) {}

  // ── Bundles ──────────────────────────────────────────────────────────
  async readBundle(namespace: SettingsNamespace, env: SettingsEnvironment, role: AdminRole) {
    ensure(role, READ_ROLES);
    const rows = await this.repo.listEntries(namespace, env);
    const sealed = await this.repo.killSwitchActiveFor(namespace);
    return {
      namespace, environment: env, sealedByKillSwitch: sealed,
      fetchedAt: new Date().toISOString(),
      entries: rows.map((r) => ({
        ...r,
        // Strip secret payload — only fingerprint + last4 reach the SDK.
        value: r.isSecret ? viewSecret(r.value as SecretEnvelope) : r.value,
        secretFingerprint: r.isSecret ? (r.value as SecretEnvelope).fingerprint : undefined,
        secretLast4: r.isSecret ? (r.value as SecretEnvelope).last4 : undefined,
      })),
    };
  }

  // ── Upsert + two-person rule ─────────────────────────────────────────
  async upsertEntry(dto: {
    namespace: SettingsNamespace; key: string; value: unknown;
    environment: SettingsEnvironment; scope: 'platform' | 'tenant' | 'environment';
    isSecret?: boolean; reason?: string;
  }, actor: Actor): Promise<any> {
    ensure(actor.role, WRITE_ROLES);
    const isSecret = dto.isSecret ?? SECRET_NAMESPACES.has(dto.namespace);
    if (isSecret && typeof dto.value !== 'string') {
      throw new BadRequestException('secret value must be a string');
    }
    const sealedValue = isSecret ? sealSecret(dto.value as string) : dto.value;
    const before = await this.repo.findEntry(dto.namespace, dto.key, dto.environment);

    if (TWO_PERSON_NAMESPACES.has(dto.namespace)) {
      const pending = await this.repo.createPendingChange({
        namespace: dto.namespace, key: dto.key, environment: dto.environment,
        proposedBy: actor.id, reason: dto.reason ?? '',
        diff: { before: before?.value ?? null, after: isSecret ? '<secret>' : dto.value },
        nextValue: sealedValue, requiredApproverRole: 'sa_admin',
      });
      await this.audit.log({
        actorId: actor.id, ip: actor.ip, domain: 'master-settings',
        action: 'propose_change',
        targetId: pending.id,
        diff: { namespace: dto.namespace, key: dto.key, env: dto.environment },
      });
      return { status: 'pending_two_person', pendingChangeId: pending.id };
    }

    const written = await this.repo.upsertEntry({
      ...dto, value: sealedValue, isSecret, updatedBy: actor.id,
    });
    await this.audit.log({
      actorId: actor.id, ip: actor.ip, domain: 'master-settings',
      action: 'upsert', targetId: written.id, diff: { key: dto.key, env: dto.environment },
    });
    return { status: 'committed', entry: written };
  }

  async approvePendingChange(id: string, actor: Actor): Promise<any> {
    ensure(actor.role, ADMIN_PLUS);
    const change = await this.repo.findPendingChange(id);
    if (!change) throw new NotFoundException('pending change not found');
    if (change.proposedBy === actor.id) {
      throw new ForbiddenException('two-person rule: approver must differ from proposer');
    }
    if (new Date(change.expiresAt) < new Date()) {
      await this.repo.rejectPendingChange(id, 'expired');
      throw new BadRequestException('pending change expired');
    }
    const written = await this.repo.commitPendingChange(id, actor.id);
    await this.audit.log({
      actorId: actor.id, ip: actor.ip, domain: 'master-settings',
      action: 'approve_change', targetId: id, diff: { committedEntryId: written.id },
    });
    return { status: 'committed', entry: written };
  }

  async rejectPendingChange(id: string, reason: string, actor: Actor) {
    ensure(actor.role, ADMIN_PLUS);
    await this.repo.rejectPendingChange(id, reason);
    await this.audit.log({
      actorId: actor.id, domain: 'master-settings',
      action: 'reject_change', targetId: id, diff: { reason },
    });
    return { status: 'rejected' };
  }

  // ── Legal / consent ──────────────────────────────────────────────────
  listLegalDocs() { return this.repo.listLegalDocs(); }

  async publishLegalDoc(dto: {
    slug: string; title: string; version: string; effectiveAt: string;
    bodyMarkdown: string; changeSummary: string; requiresReConsent: boolean;
  }, actor: Actor) {
    ensure(actor.role, ADMIN_PLUS);
    const doc = await this.repo.publishLegalDoc({ ...dto, publishedBy: actor.id });
    await this.audit.log({
      actorId: actor.id, domain: 'master-settings',
      action: 'publish_legal', targetId: doc.slug,
      diff: { version: doc.version, requiresReConsent: doc.requiresReConsent },
    });
    return doc;
  }

  async recordConsent(dto: { userId: string; docSlug: string; docVersion: string; ip: string; userAgent: string }) {
    return this.repo.recordConsent(dto);
  }

  // ── KPIs ─────────────────────────────────────────────────────────────
  listKpis(portal?: string) { return this.repo.listKpis(portal); }
  async upsertKpi(dto: any, actor: Actor) {
    ensure(actor.role, ADMIN_PLUS);
    const kpi = await this.repo.upsertKpi(dto);
    await this.audit.log({
      actorId: actor.id, domain: 'master-settings', action: 'upsert_kpi',
      targetId: kpi.id, diff: { portal: kpi.portal, metric: kpi.metric, target: kpi.target },
    });
    return kpi;
  }

  // ── Entitlements ─────────────────────────────────────────────────────
  entitlementMatrix() { return this.repo.entitlementMatrix(); }
  async updateEntitlement(dto: any, actor: Actor) {
    ensure(actor.role, ROOT_ONLY);
    const next = await this.repo.upsertEntitlement(dto);
    await this.audit.log({
      actorId: actor.id, domain: 'master-settings', action: 'update_entitlement',
      targetId: dto.portal, diff: dto,
    });
    return next;
  }

  // ── Internal roles ───────────────────────────────────────────────────
  listInternalAccounts() { return this.repo.listInternalAccounts(); }
  async mintInternalAccount(dto: { email: string; displayName: string; roles: AdminRole[]; requireMfa: boolean }, actor: Actor) {
    ensure(actor.role, ROOT_ONLY);
    const acct = await this.repo.mintInternalAccount({ ...dto, mintedBy: actor.id });
    await this.audit.log({
      actorId: actor.id, domain: 'master-settings', action: 'mint_account',
      targetId: acct.id, diff: { email: acct.email, roles: acct.roles },
    });
    return acct;
  }
  async freezeInternalAccount(id: string, reason: string, actor: Actor) {
    ensure(actor.role, ADMIN_PLUS);
    const acct = await this.repo.freezeInternalAccount(id, reason, actor.id);
    await this.audit.log({
      actorId: actor.id, domain: 'master-settings', action: 'freeze_account',
      targetId: id, diff: { reason },
    });
    return acct;
  }
  async unfreezeInternalAccount(id: string, actor: Actor) {
    ensure(actor.role, ROOT_ONLY);
    const acct = await this.repo.unfreezeInternalAccount(id);
    await this.audit.log({
      actorId: actor.id, domain: 'master-settings', action: 'unfreeze_account',
      targetId: id, diff: {},
    });
    return acct;
  }

  // ── Kill-switch matrix (two-person every flip) ───────────────────────
  killSwitchMatrix() { return this.repo.killSwitchMatrix(); }
  async proposeKillSwitch(
    domain: KillSwitchDomain,
    activate: boolean,
    body: { reason: string; expectedClearedAt?: string },
    actor: Actor,
  ) {
    ensure(actor.role, activate ? ADMIN_PLUS : ROOT_ONLY);
    // Always two-person via pending-change machinery.
    const pending = await this.repo.createPendingChange({
      namespace: 'site', // logical bucket for kill-switches
      key: `kill_switch:${domain}`,
      environment: 'production',
      proposedBy: actor.id,
      reason: body.reason,
      diff: { before: undefined, after: { active: activate, ...body } },
      nextValue: { active: activate, ...body },
      requiredApproverRole: 'sa_root',
    });
    await this.audit.log({
      actorId: actor.id, ip: actor.ip, domain: 'master-settings',
      action: activate ? 'propose_kill_activate' : 'propose_kill_clear',
      targetId: pending.id, diff: { domain },
    });
    return { status: 'pending_two_person', pendingChangeId: pending.id };
  }
}
