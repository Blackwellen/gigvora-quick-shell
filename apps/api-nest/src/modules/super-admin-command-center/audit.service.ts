/**
 * SuperAdminAuditService — the single audit sink for FD-17 master-settings
 * and the super-admin command center. Append-only by contract:
 *
 *  - Writes go to `super_admin_audit_log` (created in 0082) when the table
 *    is reachable; otherwise to an in-memory ring buffer so tests + offline
 *    boot don't crash.
 *  - Reads return the most recent N entries, optionally filtered by domain
 *    or actor.
 *
 * Every meaningful state-changing call in the FD-17 surface MUST funnel
 * through this service. The diff payload is JSONB so the audit page can
 * render before/after values.
 */
import { Injectable, Logger, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SuperAdminCommandCenterRepository } from './super-admin-command-center.repository';

export interface AuditEntry {
  id: string;
  actorId: string;
  actorRole?: string;
  domain: string;             // 'master-settings' | 'flags' | 'incidents' | …
  action: string;             // 'upsert' | 'approve_change' | 'mint_account' | …
  targetId?: string;
  ip?: string;
  userAgent?: string;
  diff?: Record<string, unknown>;
  at: string;
}

@Injectable()
export class SuperAdminAuditService {
  private readonly log = new Logger(SuperAdminAuditService.name);
  private readonly ring: AuditEntry[] = [];
  private readonly MAX = 5_000;

  constructor(@Optional() private readonly repo?: SuperAdminCommandCenterRepository) {}

  async log(input: Omit<AuditEntry, 'id' | 'at'>): Promise<AuditEntry> {
    const entry: AuditEntry = {
      id: randomUUID(),
      at: new Date().toISOString(),
      ...input,
    };
    this.ring.push(entry);
    if (this.ring.length > this.MAX) this.ring.splice(0, this.ring.length - this.MAX);

    if (this.repo && typeof (this.repo as any).appendAudit === 'function') {
      try { await (this.repo as any).appendAudit(entry); }
      catch (err) { this.log.warn(`audit DB write failed (kept in ring): ${(err as Error).message}`); }
    }
    return entry;
  }

  async list(opts: { limit?: number; domain?: string; actorId?: string } = {}): Promise<AuditEntry[]> {
    const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
    let rows: AuditEntry[] = [];
    if (this.repo && typeof (this.repo as any).listAuditEntries === 'function') {
      try { rows = await (this.repo as any).listAuditEntries({ limit, domain: opts.domain, actorId: opts.actorId }); }
      catch { rows = []; }
    }
    if (rows.length === 0) {
      rows = [...this.ring]
        .filter((r) => (opts.domain ? r.domain === opts.domain : true))
        .filter((r) => (opts.actorId ? r.actorId === opts.actorId : true))
        .reverse()
        .slice(0, limit);
    }
    return rows;
  }
}
