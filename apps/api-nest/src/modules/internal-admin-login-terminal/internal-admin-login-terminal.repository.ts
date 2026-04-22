import { Injectable, Inject } from '@nestjs/common';
import { and, asc, desc, eq, sql, gt } from 'drizzle-orm';
import {
  ialtEnvironments, ialtOperators, ialtSessions,
  ialtLoginAttempts, ialtLockouts, ialtAuditEvents,
} from '@gigvora/db/schema/internal-admin-login-terminal';

export type DrizzleDb = any;

@Injectable()
export class InternalAdminLoginTerminalRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Environments
  listEnvironments() {
    return this.db.select().from(ialtEnvironments).orderBy(asc(ialtEnvironments.slug));
  }
  async getEnvironmentBySlug(slug: string) {
    const r = await this.db.select().from(ialtEnvironments).where(eq(ialtEnvironments.slug, slug)).limit(1);
    return r[0] ?? null;
  }
  async createEnvironment(values: any) {
    const [r] = await this.db.insert(ialtEnvironments).values(values).returning(); return r;
  }
  async updateEnvironment(id: string, patch: any) {
    const [r] = await this.db.update(ialtEnvironments).set({ ...patch, updatedAt: new Date() })
      .where(eq(ialtEnvironments.id, id)).returning(); return r;
  }

  // Operators
  listOperators() { return this.db.select().from(ialtOperators).orderBy(asc(ialtOperators.email)); }
  async getOperatorById(id: string) {
    const r = await this.db.select().from(ialtOperators).where(eq(ialtOperators.id, id)).limit(1);
    return r[0] ?? null;
  }
  async getOperatorByEmail(email: string) {
    const r = await this.db.select().from(ialtOperators).where(eq(ialtOperators.email, email)).limit(1);
    return r[0] ?? null;
  }
  async getOperatorByIdentity(identityId: string) {
    const r = await this.db.select().from(ialtOperators).where(eq(ialtOperators.identityId, identityId)).limit(1);
    return r[0] ?? null;
  }
  async createOperator(values: any) { const [r] = await this.db.insert(ialtOperators).values(values).returning(); return r; }
  async updateOperator(id: string, patch: any) {
    const [r] = await this.db.update(ialtOperators).set({ ...patch, updatedAt: new Date() })
      .where(eq(ialtOperators.id, id)).returning(); return r;
  }
  async touchLastLogin(id: string) {
    await this.db.update(ialtOperators).set({ lastLoginAt: new Date() }).where(eq(ialtOperators.id, id));
  }

  // Sessions
  async createSession(values: any) { const [r] = await this.db.insert(ialtSessions).values(values).returning(); return r; }
  async getSession(id: string) {
    const r = await this.db.select().from(ialtSessions).where(eq(ialtSessions.id, id)).limit(1);
    return r[0] ?? null;
  }
  async updateSession(id: string, patch: any) {
    const [r] = await this.db.update(ialtSessions).set(patch).where(eq(ialtSessions.id, id)).returning(); return r;
  }
  listActiveSessions(operatorId: string) {
    return this.db.select().from(ialtSessions).where(and(
      eq(ialtSessions.operatorId, operatorId), eq(ialtSessions.status, 'active'),
      gt(ialtSessions.expiresAt, new Date()),
    )).orderBy(desc(ialtSessions.issuedAt));
  }

  // Attempts (append-only)
  async appendAttempt(values: any) { await this.db.insert(ialtLoginAttempts).values(values); }
  recentAttempts(limit = 200) {
    return this.db.select().from(ialtLoginAttempts).orderBy(desc(ialtLoginAttempts.attemptedAt)).limit(limit);
  }
  async countRecentFailuresForIdentity(identityId: string, sinceMinutes = 15): Promise<number> {
    const r = await this.db.select({ c: sql<number>`COUNT(*)::int` }).from(ialtLoginAttempts).where(and(
      eq(ialtLoginAttempts.identityId, identityId),
      sql`${ialtLoginAttempts.outcome} IN ('invalid_credentials','mfa_failed')`,
      sql`${ialtLoginAttempts.attemptedAt} > now() - interval '${sql.raw(String(sinceMinutes))} minutes'`,
    ));
    return r[0]?.c ?? 0;
  }
  async countRecentFailuresForIp(ip: string, sinceMinutes = 15): Promise<number> {
    const r = await this.db.select({ c: sql<number>`COUNT(*)::int` }).from(ialtLoginAttempts).where(and(
      eq(ialtLoginAttempts.ip, ip),
      sql`${ialtLoginAttempts.outcome} IN ('invalid_credentials','mfa_failed')`,
      sql`${ialtLoginAttempts.attemptedAt} > now() - interval '${sql.raw(String(sinceMinutes))} minutes'`,
    ));
    return r[0]?.c ?? 0;
  }

  // Lockouts
  async getActiveLockout(scope: 'identity'|'ip', key: string) {
    const r = await this.db.select().from(ialtLockouts).where(and(
      eq(ialtLockouts.scope, scope), eq(ialtLockouts.scopeKey, key),
      gt(ialtLockouts.lockedUntil, new Date()),
    )).limit(1);
    return r[0] ?? null;
  }
  async upsertLockout(scope: 'identity'|'ip', key: string, reason: string, lockMinutes: number, failed: number) {
    const lockedUntil = new Date(Date.now() + lockMinutes * 60_000);
    const existing = await this.db.select().from(ialtLockouts).where(and(
      eq(ialtLockouts.scope, scope), eq(ialtLockouts.scopeKey, key),
    )).limit(1);
    if (existing[0]) {
      await this.db.update(ialtLockouts).set({ reason, failedCount: failed, lockedUntil })
        .where(eq(ialtLockouts.id, existing[0].id));
    } else {
      await this.db.insert(ialtLockouts).values({ scope, scopeKey: key, reason, failedCount: failed, lockedUntil });
    }
  }
  async clearLockout(scope: 'identity'|'ip', key: string) {
    await this.db.delete(ialtLockouts).where(and(eq(ialtLockouts.scope, scope), eq(ialtLockouts.scopeKey, key)));
  }

  // Audit
  async recordAudit(p: { operatorId?: string|null; identityId?: string|null; action: string;
    environmentSlug?: string|null; targetType?: string|null; targetId?: string|null;
    diff?: any; ip?: string|null; userAgent?: string|null; }) {
    await this.db.insert(ialtAuditEvents).values({
      operatorId: p.operatorId ?? null, identityId: p.identityId ?? null,
      action: p.action, environmentSlug: p.environmentSlug ?? null,
      targetType: p.targetType ?? null, targetId: p.targetId ?? null,
      diff: p.diff ?? {}, ip: p.ip ?? null, userAgent: p.userAgent ?? null,
    });
  }
  recentAudit(limit = 200) {
    return this.db.select().from(ialtAuditEvents).orderBy(desc(ialtAuditEvents.createdAt)).limit(limit);
  }
}
