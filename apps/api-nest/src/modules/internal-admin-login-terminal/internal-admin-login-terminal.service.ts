import { Injectable, BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InternalAdminLoginTerminalRepository } from './internal-admin-login-terminal.repository';
import { SESSION_TRANSITIONS } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

const FAILURE_THRESHOLD_IDENTITY = 5;
const FAILURE_THRESHOLD_IP = 20;
const LOCK_MINUTES_IDENTITY = 15;
const LOCK_MINUTES_IP = 30;
const SESSION_MINUTES = 60;
const STEPUP_VALID_MINUTES = 30;

@Injectable()
export class InternalAdminLoginTerminalService {
  private readonly logger = new Logger(InternalAdminLoginTerminalService.name);
  constructor(private readonly repo: InternalAdminLoginTerminalRepository) {}

  // ─── Overview / KPIs ────────────────────────────────
  async overview() {
    const [envs, ops, attempts, audit] = await Promise.all([
      this.repo.listEnvironments(),
      this.repo.listOperators(),
      this.repo.recentAttempts(50),
      this.repo.recentAudit(20),
    ]);
    const failures24h = attempts.filter((a: any) =>
      a.outcome !== 'success' && new Date(a.attemptedAt) > new Date(Date.now() - 86_400_000)).length;
    const insights = await this.fetchInsights({
      operators: ops.length,
      activeOperators: ops.filter((o: any) => o.status === 'active').length,
      mfaEnrolled: ops.filter((o: any) => o.mfaEnrolled).length,
      failures24h,
    }).catch(() => this.fallbackInsights({ failures24h, ops: ops.length }));
    return {
      kpis: {
        environments: envs.length,
        operators: ops.length,
        activeOperators: ops.filter((o: any) => o.status === 'active').length,
        mfaEnrolled: ops.filter((o: any) => o.mfaEnrolled).length,
        failures24h,
      },
      recentAttempts: attempts.slice(0, 20),
      recentAudit: audit,
      insights,
      computedAt: new Date().toISOString(),
    };
  }
  private async fetchInsights(signals: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/internal-admin-login-terminal/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals);
  }
  private fallbackInsights(s: any) {
    const out: any[] = [];
    if ((s.failures24h ?? 0) > 20) out.push({ id: 'failure_spike', severity: 'warn', title: 'Login failures elevated in last 24h.' });
    if ((s.mfaEnrolled ?? 0) < (s.operators ?? 0)) out.push({ id: 'mfa_gap', severity: 'warn', title: 'Some operators have not enrolled MFA.' });
    if (!out.length) out.push({ id: 'healthy', severity: 'success', title: 'Terminal posture healthy.' });
    return out;
  }

  // ─── Environments ───────────────────────────────────
  listEnvironments() { return this.repo.listEnvironments(); }
  async createEnvironment(actorId: string, dto: any, req?: any) {
    const r = await this.repo.createEnvironment({ status: 'active', ...dto });
    await this.repo.recordAudit({ operatorId: actorId, action: 'env.created', environmentSlug: r.slug, targetType: 'environment', targetId: r.id, diff: dto, ip: req?.ip, userAgent: req?.userAgent });
    return r;
  }
  async updateEnvironment(actorId: string, id: string, dto: any, req?: any) {
    const cur = await this.repo.listEnvironments().then((rows: any[]) => rows.find(r => r.id === id));
    if (!cur) throw new NotFoundException('environment not found');
    const r = await this.repo.updateEnvironment(id, dto);
    await this.repo.recordAudit({ operatorId: actorId, action: 'env.updated', environmentSlug: r.slug, targetType: 'environment', targetId: id, diff: dto, ip: req?.ip, userAgent: req?.userAgent });
    return r;
  }

  // ─── Operators ──────────────────────────────────────
  listOperators() { return this.repo.listOperators(); }
  async createOperator(actorId: string, dto: any, req?: any) {
    if (await this.repo.getOperatorByEmail(dto.email)) throw new BadRequestException('email already exists');
    if (await this.repo.getOperatorByIdentity(dto.identityId)) throw new BadRequestException('identity already operator');
    const r = await this.repo.createOperator({ status: 'active', ...dto });
    await this.repo.recordAudit({ operatorId: actorId, action: 'operator.created', targetType: 'operator', targetId: r.id, diff: { email: dto.email, role: dto.role }, ip: req?.ip, userAgent: req?.userAgent });
    return r;
  }
  async updateOperator(actorId: string, id: string, dto: any, req?: any) {
    const cur = await this.repo.getOperatorById(id);
    if (!cur) throw new NotFoundException('operator not found');
    const r = await this.repo.updateOperator(id, dto);
    await this.repo.recordAudit({ operatorId: actorId, action: 'operator.updated', targetType: 'operator', targetId: id, diff: dto, ip: req?.ip, userAgent: req?.userAgent });
    return r;
  }

  // ─── Login flow ─────────────────────────────────────
  async login(dto: { email: string; environmentSlug: string; credentialVerified: boolean; mfaCode?: string }, req?: { ip?: string; userAgent?: string }) {
    const ip = req?.ip ?? null;
    const ua = req?.userAgent ?? null;

    // 1. IP lockout
    if (ip) {
      const ipLock = await this.repo.getActiveLockout('ip', ip);
      if (ipLock) {
        await this.repo.appendAttempt({ email: dto.email, environmentSlug: dto.environmentSlug, outcome: 'locked', ip, userAgent: ua, reason: 'ip_lockout' });
        throw new UnauthorizedException(`ip locked until ${ipLock.lockedUntil}`);
      }
    }

    // 2. Operator lookup
    const op = await this.repo.getOperatorByEmail(dto.email);
    if (!op) {
      await this.repo.appendAttempt({ email: dto.email, environmentSlug: dto.environmentSlug, outcome: 'unknown', ip, userAgent: ua });
      await this.maybeLockIp(ip);
      throw new UnauthorizedException('invalid credentials');
    }
    if (op.status !== 'active') {
      await this.repo.appendAttempt({ identityId: op.identityId, email: op.email, environmentSlug: dto.environmentSlug, outcome: 'inactive', ip, userAgent: ua });
      throw new UnauthorizedException('account inactive');
    }

    // 3. Identity lockout
    const idLock = await this.repo.getActiveLockout('identity', op.identityId);
    if (idLock) {
      await this.repo.appendAttempt({ identityId: op.identityId, email: op.email, environmentSlug: dto.environmentSlug, outcome: 'locked', ip, userAgent: ua, reason: 'identity_lockout' });
      throw new UnauthorizedException(`account locked until ${idLock.lockedUntil}`);
    }

    // 4. Environment policy
    const env = await this.repo.getEnvironmentBySlug(dto.environmentSlug);
    if (!env || env.status !== 'active') {
      await this.repo.appendAttempt({ identityId: op.identityId, email: op.email, environmentSlug: dto.environmentSlug, outcome: 'env_forbidden', ip, userAgent: ua, reason: 'env_unavailable' });
      throw new ForbiddenException('environment unavailable');
    }
    if (!(op.allowedEnvs ?? []).includes(env.slug)) {
      await this.repo.appendAttempt({ identityId: op.identityId, email: op.email, environmentSlug: env.slug, outcome: 'env_forbidden', ip, userAgent: ua, reason: 'not_in_allowed_envs' });
      throw new ForbiddenException('environment not permitted for operator');
    }
    if ((env.ipAllowlist?.length ?? 0) > 0 && ip && !env.ipAllowlist.includes(ip)) {
      await this.repo.appendAttempt({ identityId: op.identityId, email: op.email, environmentSlug: env.slug, outcome: 'ip_forbidden', ip, userAgent: ua, reason: 'env_ip_allowlist' });
      throw new ForbiddenException('ip not allowed for this environment');
    }

    // 5. Credential check (verified upstream by SSO/password gateway)
    if (!dto.credentialVerified) {
      await this.repo.appendAttempt({ identityId: op.identityId, email: op.email, environmentSlug: env.slug, outcome: 'invalid_credentials', ip, userAgent: ua });
      await this.maybeLockIdentity(op.identityId);
      await this.maybeLockIp(ip);
      throw new UnauthorizedException('invalid credentials');
    }

    // 6. Decide step-up
    const requireStepUp = env.requiresStepUp || env.riskBand === 'critical' || env.riskBand === 'high';
    if (requireStepUp && !op.mfaEnrolled) {
      await this.repo.appendAttempt({ identityId: op.identityId, email: op.email, environmentSlug: env.slug, outcome: 'mfa_failed', ip, userAgent: ua, reason: 'mfa_not_enrolled' });
      throw new ForbiddenException('mfa enrolment required for this environment');
    }

    // 7. Issue session
    const sessionStatus = requireStepUp ? 'stepup_pending' : 'active';
    const expiresAt = new Date(Date.now() + SESSION_MINUTES * 60_000);
    const sess = await this.repo.createSession({
      operatorId: op.id, environmentSlug: env.slug, status: sessionStatus,
      ip, userAgent: ua, expiresAt,
    });
    await this.repo.appendAttempt({ identityId: op.identityId, email: op.email, environmentSlug: env.slug, outcome: 'success', ip, userAgent: ua });
    await this.repo.touchLastLogin(op.id);
    await this.repo.clearLockout('identity', op.identityId);
    await this.repo.recordAudit({ operatorId: op.id, identityId: op.identityId, action: 'session.issued', environmentSlug: env.slug, targetType: 'session', targetId: sess.id, ip, userAgent: ua, diff: { stepUp: requireStepUp } });

    // 8. If step-up + code provided in same call, attempt verification
    if (requireStepUp && dto.mfaCode) {
      return this.verifyStepUp({ sessionId: sess.id, mfaCode: dto.mfaCode }, req);
    }
    return sess;
  }

  private async maybeLockIdentity(identityId: string) {
    const fails = await this.repo.countRecentFailuresForIdentity(identityId);
    if (fails >= FAILURE_THRESHOLD_IDENTITY) {
      await this.repo.upsertLockout('identity', identityId, 'too_many_failures', LOCK_MINUTES_IDENTITY, fails);
    }
  }
  private async maybeLockIp(ip: string | null) {
    if (!ip) return;
    const fails = await this.repo.countRecentFailuresForIp(ip);
    if (fails >= FAILURE_THRESHOLD_IP) {
      await this.repo.upsertLockout('ip', ip, 'too_many_failures', LOCK_MINUTES_IP, fails);
    }
  }

  // ─── Step-up MFA ────────────────────────────────────
  async verifyStepUp(dto: { sessionId: string; mfaCode: string }, req?: any) {
    const sess = await this.repo.getSession(dto.sessionId);
    if (!sess) throw new NotFoundException('session not found');
    if (sess.status !== 'stepup_pending') throw new BadRequestException('session not awaiting step-up');
    if (new Date(sess.expiresAt) < new Date()) throw new UnauthorizedException('session expired');
    // Deterministic MFA verification stub: any 6-digit numeric code = pass.
    // Real implementation would call TOTP/WebAuthn upstream.
    const ok = /^\d{6}$/.test(dto.mfaCode);
    const op = await this.repo.getOperatorById(sess.operatorId);
    if (!ok) {
      await this.repo.appendAttempt({ identityId: op?.identityId, email: op?.email, environmentSlug: sess.environmentSlug, outcome: 'mfa_failed', ip: req?.ip, userAgent: req?.userAgent, reason: 'invalid_code' });
      await this.maybeLockIdentity(op!.identityId);
      throw new UnauthorizedException('mfa failed');
    }
    const r = await this.repo.updateSession(sess.id, { status: 'active', stepUpVerifiedAt: new Date() });
    await this.repo.recordAudit({ operatorId: op!.id, identityId: op!.identityId, action: 'session.stepup_verified', environmentSlug: sess.environmentSlug, targetType: 'session', targetId: sess.id, ip: req?.ip, userAgent: req?.userAgent });
    return r;
  }

  // ─── Switch environment (re-issues a session row) ───
  async switchEnvironment(actorId: string, dto: { sessionId: string; environmentSlug: string }, req?: any) {
    const sess = await this.repo.getSession(dto.sessionId);
    if (!sess) throw new NotFoundException('session not found');
    if (sess.status !== 'active') throw new BadRequestException('session not active');
    if (new Date(sess.expiresAt) < new Date()) throw new UnauthorizedException('session expired');
    const op = await this.repo.getOperatorById(sess.operatorId);
    if (!op || op.id !== actorId) throw new ForbiddenException('not your session');
    const env = await this.repo.getEnvironmentBySlug(dto.environmentSlug);
    if (!env || env.status !== 'active') throw new ForbiddenException('environment unavailable');
    if (!(op.allowedEnvs ?? []).includes(env.slug)) throw new ForbiddenException('environment not permitted');
    // Revoke the old session, issue a new one (with step-up if needed)
    await this.repo.updateSession(sess.id, { status: 'revoked', revokedAt: new Date() });
    const requireStepUp = env.requiresStepUp || env.riskBand === 'critical' || env.riskBand === 'high';
    const next = await this.repo.createSession({
      operatorId: op.id, environmentSlug: env.slug,
      status: requireStepUp ? 'stepup_pending' : 'active',
      ip: req?.ip, userAgent: req?.userAgent,
      expiresAt: new Date(Date.now() + SESSION_MINUTES * 60_000),
    });
    await this.repo.recordAudit({ operatorId: op.id, identityId: op.identityId, action: 'session.env_switch', environmentSlug: env.slug, targetType: 'session', targetId: next.id, diff: { from: sess.environmentSlug, to: env.slug }, ip: req?.ip, userAgent: req?.userAgent });
    return next;
  }

  // ─── Session lifecycle ──────────────────────────────
  async revokeSession(actorId: string, id: string, req?: any) {
    const sess = await this.repo.getSession(id);
    if (!sess) throw new NotFoundException('session not found');
    if (sess.operatorId !== actorId) throw new ForbiddenException('not your session');
    if (!SESSION_TRANSITIONS[sess.status]?.includes('revoked'))
      throw new BadRequestException('cannot revoke from ' + sess.status);
    const r = await this.repo.updateSession(id, { status: 'revoked', revokedAt: new Date() });
    await this.repo.recordAudit({ operatorId: actorId, action: 'session.revoked', environmentSlug: sess.environmentSlug, targetType: 'session', targetId: id, ip: req?.ip, userAgent: req?.userAgent });
    return r;
  }
  listMySessions(operatorId: string) { return this.repo.listActiveSessions(operatorId); }

  // ─── Forensics ──────────────────────────────────────
  recentAttempts() { return this.repo.recentAttempts(); }
  recentAudit() { return this.repo.recentAudit(); }
}
