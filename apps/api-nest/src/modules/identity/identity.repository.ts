import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class IdentityRepository {
  constructor(private readonly ds: DataSource) {}

  // ---- identities ----
  findByEmail(email: string) {
    return this.ds.query<any[]>(
      `SELECT * FROM identities WHERE email = $1 LIMIT 1`, [email.toLowerCase()],
    ).then(r => r[0] ?? null);
  }
  findById(id: string) {
    return this.ds.query<any[]>(`SELECT * FROM identities WHERE id = $1 LIMIT 1`, [id]).then(r => r[0] ?? null);
  }
  async createIdentity(email: string, passwordHash: string, displayName: string | null, marketingOptIn: boolean) {
    const r = await this.ds.query(
      `INSERT INTO identities (email, password_hash, display_name, marketing_opt_in)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [email.toLowerCase(), passwordHash, displayName, marketingOptIn],
    );
    return r[0];
  }
  async setPassword(id: string, passwordHash: string) {
    await this.ds.query(
      `UPDATE identities SET password_hash=$2, failed_attempts=0, locked_until=NULL, updated_at=now() WHERE id=$1`,
      [id, passwordHash],
    );
  }
  async incrementFailed(id: string, lockAfter = 5, lockMinutes = 15) {
    const r = await this.ds.query(
      `UPDATE identities
         SET failed_attempts = failed_attempts + 1,
             locked_until = CASE WHEN failed_attempts + 1 >= $2 THEN now() + ($3 || ' minutes')::interval ELSE locked_until END,
             status = CASE WHEN failed_attempts + 1 >= $2 THEN 'locked' ELSE status END,
             updated_at = now()
       WHERE id = $1
       RETURNING failed_attempts, locked_until, status`,
      [id, lockAfter, lockMinutes],
    );
    return r[0];
  }
  async resetFailed(id: string, ip: string | null) {
    await this.ds.query(
      `UPDATE identities SET failed_attempts=0, locked_until=NULL, last_login_at=now(),
         last_login_ip=$2, status=CASE WHEN status='locked' THEN 'active' ELSE status END,
         updated_at=now() WHERE id=$1`, [id, ip],
    );
  }
  async markEmailVerified(id: string) {
    await this.ds.query(`UPDATE identities SET email_verified=true, updated_at=now() WHERE id=$1`, [id]);
  }

  // ---- email verification ----
  async createEmailVerification(identityId: string, email: string, token: string, ttlMinutes = 60 * 24) {
    await this.ds.query(
      `INSERT INTO email_verifications (identity_id, email, token, expires_at)
       VALUES ($1,$2,$3, now() + ($4 || ' minutes')::interval)`,
      [identityId, email, token, ttlMinutes],
    );
  }
  consumeEmailVerification(token: string) {
    return this.ds.query<any[]>(
      `UPDATE email_verifications SET status='verified', verified_at=now()
       WHERE token=$1 AND status='pending' AND expires_at > now()
       RETURNING identity_id AS "identityId", email`, [token],
    ).then(r => r[0] ?? null);
  }

  // ---- password reset ----
  async createPasswordReset(identityId: string, token: string, ip: string | null, ua: string | null, ttlMinutes = 60) {
    await this.ds.query(
      `INSERT INTO password_resets (identity_id, token, expires_at, ip, user_agent)
       VALUES ($1,$2, now() + ($3 || ' minutes')::interval, $4, $5)`,
      [identityId, token, ttlMinutes, ip, ua],
    );
  }
  consumePasswordReset(token: string) {
    return this.ds.query<any[]>(
      `UPDATE password_resets SET status='used', used_at=now()
       WHERE token=$1 AND status='pending' AND expires_at > now()
       RETURNING identity_id AS "identityId"`, [token],
    ).then(r => r[0] ?? null);
  }

  // ---- sessions ----
  async createSession(identityId: string, refreshHash: string, ttlDays = 30, ua?: string|null, ip?: string|null, deviceLabel?: string|null) {
    const r = await this.ds.query(
      `INSERT INTO sessions (identity_id, refresh_hash, expires_at, user_agent, ip, device_label)
       VALUES ($1,$2, now() + ($3 || ' days')::interval, $4, $5, $6)
       RETURNING id, expires_at AS "expiresAt"`, [identityId, refreshHash, ttlDays, ua ?? null, ip ?? null, deviceLabel ?? null],
    );
    return r[0];
  }
  findActiveSessionByRefresh(hash: string) {
    return this.ds.query<any[]>(
      `SELECT * FROM sessions WHERE refresh_hash=$1 AND status='active' AND expires_at > now() LIMIT 1`,
      [hash],
    ).then(r => r[0] ?? null);
  }
  async revokeSessionByHash(hash: string) {
    await this.ds.query(`UPDATE sessions SET status='revoked', revoked_at=now() WHERE refresh_hash=$1`, [hash]);
  }
  listSessions(identityId: string) {
    return this.ds.query(
      `SELECT id, user_agent AS "userAgent", ip, device_label AS "deviceLabel",
              status, last_seen_at AS "lastSeenAt", expires_at AS "expiresAt", created_at AS "createdAt"
       FROM sessions WHERE identity_id=$1 ORDER BY last_seen_at DESC`, [identityId],
    );
  }
  async revokeSession(id: string, identityId: string) {
    await this.ds.query(
      `UPDATE sessions SET status='revoked', revoked_at=now() WHERE id=$1 AND identity_id=$2`, [id, identityId],
    );
  }

  // ---- login attempts ----
  async logAttempt(email: string, identityId: string | null, outcome: string, ip: string | null, ua: string | null, riskScore: number | null, meta: any = {}) {
    await this.ds.query(
      `INSERT INTO login_attempts (email, identity_id, outcome, ip, user_agent, risk_score, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [email.toLowerCase(), identityId, outcome, ip, ua, riskScore, JSON.stringify(meta)],
    );
  }
  async recentAttempts(email: string, ip: string | null, minutes = 60) {
    const r = await this.ds.query(
      `SELECT outcome, count(*)::int AS c
         FROM login_attempts
        WHERE created_at > now() - ($3 || ' minutes')::interval
          AND (lower(email) = lower($1) OR ip = $2::inet)
        GROUP BY outcome`,
      [email, ip ?? '0.0.0.0', minutes],
    );
    return r as { outcome: string; c: number }[];
  }

  // ---- mfa ----
  async createMfaFactor(identityId: string, type: string, label: string | null, secret: string | null) {
    const r = await this.ds.query(
      `INSERT INTO mfa_factors (identity_id, type, label, secret) VALUES ($1,$2,$3,$4)
       RETURNING id, type, label, status, created_at AS "createdAt"`,
      [identityId, type, label, secret],
    );
    return r[0];
  }
  async activateMfa(factorId: string, identityId: string) {
    await this.ds.query(
      `UPDATE mfa_factors SET status='active', last_used_at=now() WHERE id=$1 AND identity_id=$2`,
      [factorId, identityId],
    );
  }
  listMfa(identityId: string) {
    return this.ds.query(
      `SELECT id, type, label, status, last_used_at AS "lastUsedAt", created_at AS "createdAt"
       FROM mfa_factors WHERE identity_id=$1 ORDER BY created_at DESC`, [identityId],
    );
  }
  hasActiveMfa(identityId: string) {
    return this.ds.query<any[]>(
      `SELECT 1 FROM mfa_factors WHERE identity_id=$1 AND status='active' LIMIT 1`, [identityId],
    ).then(r => r.length > 0);
  }
  getFactor(factorId: string) {
    return this.ds.query<any[]>(`SELECT * FROM mfa_factors WHERE id=$1 LIMIT 1`, [factorId]).then(r => r[0] ?? null);
  }

  // ---- onboarding ----
  getOnboarding(identityId: string) {
    return this.ds.query<any[]>(
      `SELECT identity_id AS "identityId", status, current_step AS "currentStep", payload,
              completed_at AS "completedAt", updated_at AS "updatedAt"
       FROM onboarding_progress WHERE identity_id=$1`, [identityId],
    ).then(r => r[0] ?? null);
  }
  async upsertOnboarding(identityId: string, status: string | null, currentStep: string | null, payload: any) {
    const r = await this.ds.query(
      `INSERT INTO onboarding_progress (identity_id, status, current_step, payload,
         completed_at)
       VALUES ($1, COALESCE($2,'in_progress'), $3, COALESCE($4,'{}'::jsonb),
         CASE WHEN $2='completed' THEN now() ELSE NULL END)
       ON CONFLICT (identity_id) DO UPDATE SET
         status = COALESCE(EXCLUDED.status, onboarding_progress.status),
         current_step = COALESCE(EXCLUDED.current_step, onboarding_progress.current_step),
         payload = onboarding_progress.payload || EXCLUDED.payload,
         completed_at = CASE WHEN EXCLUDED.status='completed' AND onboarding_progress.completed_at IS NULL THEN now() ELSE onboarding_progress.completed_at END,
         updated_at = now()
       RETURNING identity_id AS "identityId", status, current_step AS "currentStep", payload,
                 completed_at AS "completedAt", updated_at AS "updatedAt"`,
      [identityId, status, currentStep, payload ?? {}],
    );
    return r[0];
  }

  // ---- verifications (KYC / badges) ----
  async createVerification(identityId: string, kind: string, evidence: any) {
    const r = await this.ds.query(
      `INSERT INTO verifications (identity_id, kind, evidence) VALUES ($1,$2,COALESCE($3,'{}'::jsonb))
       RETURNING id, kind, status, created_at AS "createdAt"`,
      [identityId, kind, evidence],
    );
    return r[0];
  }
  listVerifications(identityId: string) {
    return this.ds.query(
      `SELECT id, kind, status, evidence, reviewer_note AS "reviewerNote",
              decided_at AS "decidedAt", created_at AS "createdAt"
       FROM verifications WHERE identity_id=$1 ORDER BY created_at DESC`, [identityId],
    );
  }
  async decideVerification(id: string, reviewerId: string | null, decision: string, note: string | null) {
    const r = await this.ds.query(
      `UPDATE verifications SET status=$2, reviewer_id=$3, reviewer_note=$4, decided_at=now(), updated_at=now()
       WHERE id=$1 RETURNING id, identity_id AS "identityId", kind, status, decided_at AS "decidedAt"`,
      [id, decision, reviewerId, note],
    );
    return r[0] ?? null;
  }
  pendingVerifications(limit = 50) {
    return this.ds.query(
      `SELECT v.id, v.identity_id AS "identityId", v.kind, v.status, v.created_at AS "createdAt",
              i.email
       FROM verifications v JOIN identities i ON i.id = v.identity_id
       WHERE v.status IN ('pending','escalated')
       ORDER BY v.created_at ASC LIMIT $1`, [Math.min(limit, 200)],
    );
  }

  // ---- audit ----
  async audit(identityId: string | null, actorId: string | null, action: string, ip: string | null, ua: string | null, meta: any = {}) {
    await this.ds.query(
      `INSERT INTO identity_audit (identity_id, actor_id, action, ip, user_agent, meta)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
      [identityId, actorId, action, ip, ua, JSON.stringify(meta)],
    );
  }
}
