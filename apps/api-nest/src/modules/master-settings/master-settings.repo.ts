/**
 * Storage port for master settings. Two backends:
 *   - Production: Drizzle / pg via `0083_master_settings_backbone.sql`
 *   - Tests + offline boot: in-memory map (this file's default)
 *
 * The signatures match what `MasterSettingsService` expects so a Drizzle
 * implementation can drop in without changing the service.
 */
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SettingsEnvironment, SettingsNamespace, AdminRole } from './master-settings.types';

export interface EntryRow {
  id: string;
  namespace: SettingsNamespace;
  key: string;
  value: unknown;
  scope: 'platform' | 'tenant' | 'environment';
  environment: SettingsEnvironment;
  isSecret: boolean;
  updatedAt: string;
  updatedBy?: string | null;
  version: number;
}

export interface PendingRow {
  id: string;
  namespace: SettingsNamespace;
  key: string;
  environment: SettingsEnvironment;
  proposedBy: string;
  proposedAt: string;
  expiresAt: string;
  reason: string;
  diff: { before: unknown; after: unknown };
  nextValue: unknown;
  requiredApproverRole: 'sa_admin' | 'sa_root';
  status: 'pending' | 'committed' | 'rejected' | 'expired';
}

@Injectable()
export class MasterSettingsRepo {
  private entries = new Map<string, EntryRow>();
  private pending = new Map<string, PendingRow>();
  private legal = new Map<string, any>();
  private consent: any[] = [];
  private kpis = new Map<string, any>();
  private entitlements = new Map<string, any>();
  private accounts = new Map<string, any>();
  private kills = new Map<string, any>();

  private k(ns: SettingsNamespace, key: string, env: SettingsEnvironment) { return `${ns}::${key}::${env}`; }

  // Entries
  async listEntries(ns: SettingsNamespace, env: SettingsEnvironment) {
    return [...this.entries.values()].filter((e) => e.namespace === ns && e.environment === env);
  }
  async findEntry(ns: SettingsNamespace, key: string, env: SettingsEnvironment) {
    return this.entries.get(this.k(ns, key, env));
  }
  async upsertEntry(input: Omit<EntryRow, 'id' | 'updatedAt' | 'version'> & { value: unknown }) {
    const k = this.k(input.namespace, input.key, input.environment);
    const prior = this.entries.get(k);
    const next: EntryRow = {
      ...input,
      id: prior?.id ?? randomUUID(),
      updatedAt: new Date().toISOString(),
      version: (prior?.version ?? 0) + 1,
    };
    this.entries.set(k, next);
    return next;
  }

  async killSwitchActiveFor(_ns: SettingsNamespace) {
    return [...this.kills.values()].some((k) => k.active);
  }

  // Pending
  async createPendingChange(input: Omit<PendingRow, 'id' | 'proposedAt' | 'expiresAt' | 'status'>) {
    const id = randomUUID();
    const now = new Date();
    const row: PendingRow = {
      id, ...input, proposedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(),
      status: 'pending',
    };
    this.pending.set(id, row);
    return row;
  }
  async findPendingChange(id: string) { return this.pending.get(id); }
  async commitPendingChange(id: string, approverId: string) {
    const row = this.pending.get(id);
    if (!row) throw new Error('pending not found');
    row.status = 'committed';
    const written = await this.upsertEntry({
      namespace: row.namespace, key: row.key, environment: row.environment,
      scope: 'platform', value: row.nextValue, isSecret: false, updatedBy: approverId,
    });
    return written;
  }
  async rejectPendingChange(id: string, reason: string) {
    const row = this.pending.get(id);
    if (row) { row.status = 'rejected'; (row as any).rejectionReason = reason; }
    return row;
  }

  // Legal
  async listLegalDocs() { return [...this.legal.values()]; }
  async publishLegalDoc(input: any) { this.legal.set(input.slug, { ...input, publishedAt: new Date().toISOString() }); return this.legal.get(input.slug); }
  async recordConsent(input: any) {
    const row = { id: randomUUID(), ...input, acceptedAt: new Date().toISOString() };
    this.consent.push(row);
    return row;
  }

  // KPI
  async listKpis(portal?: string) {
    const all = [...this.kpis.values()];
    return portal ? all.filter((k) => k.portal === portal) : all;
  }
  async upsertKpi(input: any) {
    const id = input.id ?? randomUUID();
    const row = { ...input, id };
    this.kpis.set(id, row);
    return row;
  }

  // Entitlements
  async entitlementMatrix() { return [...this.entitlements.values()]; }
  async upsertEntitlement(input: any) { this.entitlements.set(input.portal, input); return input; }

  // Accounts
  async listInternalAccounts() { return [...this.accounts.values()]; }
  async mintInternalAccount(input: { email: string; displayName: string; roles: AdminRole[]; requireMfa: boolean; mintedBy: string }) {
    const id = randomUUID();
    const row = {
      id, userId: id, ...input, status: input.requireMfa ? 'pending_mfa' : 'active',
      mfaEnrolled: false, mintedAt: new Date().toISOString(),
    };
    this.accounts.set(id, row);
    return row;
  }
  async freezeInternalAccount(id: string, reason: string, byId: string) {
    const acct = this.accounts.get(id);
    if (!acct) throw new Error('account not found');
    Object.assign(acct, { status: 'frozen', frozenAt: new Date().toISOString(), frozenBy: byId, freezeReason: reason });
    return acct;
  }
  async unfreezeInternalAccount(id: string) {
    const acct = this.accounts.get(id);
    if (!acct) throw new Error('account not found');
    Object.assign(acct, { status: 'active', frozenAt: null, frozenBy: null, freezeReason: null });
    return acct;
  }

  // Kill-switch
  async killSwitchMatrix() { return { switches: [...this.kills.values()], computedAt: new Date().toISOString() }; }
}
