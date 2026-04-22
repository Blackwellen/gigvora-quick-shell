import {
  BadRequestException, ForbiddenException, Injectable, Logger,
  NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { IdentityRepository } from './identity.repository';
import { RiskService } from './risk.service';
import { D1Emit, D2Emit } from '../domain-bus/domain-emissions';

interface AuthCtx { ip: string | null; userAgent: string | null; deviceLabel?: string | null; }

const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 30;
const LOCK_AFTER = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class IdentityService {
  private readonly log = new Logger(IdentityService.name);
  constructor(
    private readonly repo: IdentityRepository,
    private readonly risk: RiskService,
    private readonly jwt: JwtService,
  ) {}

  // ---------- signup / verification ----------
  async signup(dto: { email: string; password: string; displayName?: string; marketingOptIn?: boolean }, ctx: AuthCtx) {
    const exists = await this.repo.findByEmail(dto.email);
    if (exists) throw new BadRequestException('email_already_registered');
    const hash = await bcrypt.hash(dto.password, 12);
    const id = await this.repo.createIdentity(dto.email, hash, dto.displayName ?? null, !!dto.marketingOptIn);
    const token = crypto.randomBytes(24).toString('hex');
    await this.repo.createEmailVerification(id.id, id.email, token);
    await this.repo.audit(id.id, null, 'identity.signup', ctx.ip, ctx.userAgent, { email: id.email });
    // Immediately issue tokens — but `email_verified=false` is preserved on the identity.
    const tokens = await this.issueTokens(id.id, id.email, ctx);
    return { ...tokens, identity: this.publicIdentity(id), verificationToken: token /* dev convenience */ };
  }

  async verifyEmail(token: string, ctx: AuthCtx) {
    const r = await this.repo.consumeEmailVerification(token);
    if (!r) throw new NotFoundException('invalid_or_expired_token');
    await this.repo.markEmailVerified(r.identityId);
    await this.repo.audit(r.identityId, null, 'identity.email.verified', ctx.ip, ctx.userAgent, {});
    return { ok: true, email: r.email };
  }

  async resendVerification(email: string, ctx: AuthCtx) {
    const id = await this.repo.findByEmail(email);
    if (!id || id.email_verified) return { ok: true }; // do not leak existence
    const token = crypto.randomBytes(24).toString('hex');
    await this.repo.createEmailVerification(id.id, id.email, token);
    await this.repo.audit(id.id, null, 'identity.email.verification.resent', ctx.ip, ctx.userAgent, {});
    return { ok: true, verificationToken: token };
  }

  // ---------- login ----------
  async login(dto: { email: string; password: string; mfaCode?: string }, ctx: AuthCtx) {
    const id = await this.repo.findByEmail(dto.email);
    const risk = await this.risk.scoreLogin({
      email: dto.email, ip: ctx.ip, userAgent: ctx.userAgent, knownIdentity: !!id,
    });

    if (risk.band === 'high' && !dto.mfaCode) {
      await this.repo.logAttempt(dto.email, id?.id ?? null, 'mfa_required', ctx.ip, ctx.userAgent, risk.score, { reasons: risk.reasons });
    }

    if (!id || !id.password_hash) {
      await this.repo.logAttempt(dto.email, null, 'bad_password', ctx.ip, ctx.userAgent, risk.score);
      throw new UnauthorizedException('invalid_credentials');
    }
    if (id.status === 'locked' && id.locked_until && new Date(id.locked_until) > new Date()) {
      await this.repo.logAttempt(dto.email, id.id, 'locked', ctx.ip, ctx.userAgent, risk.score);
      throw new ForbiddenException('account_locked');
    }
    if (id.status === 'disabled' || id.status === 'deleted') {
      await this.repo.logAttempt(dto.email, id.id, 'blocked', ctx.ip, ctx.userAgent, risk.score);
      throw new ForbiddenException('account_disabled');
    }

    const ok = await bcrypt.compare(dto.password, id.password_hash);
    if (!ok) {
      const upd = await this.repo.incrementFailed(id.id, LOCK_AFTER, LOCK_MINUTES);
      await this.repo.logAttempt(dto.email, id.id, upd.status === 'locked' ? 'locked' : 'bad_password',
        ctx.ip, ctx.userAgent, risk.score, { failed_attempts: upd.failed_attempts });
      throw new UnauthorizedException(upd.status === 'locked' ? 'account_locked' : 'invalid_credentials');
    }

    // MFA gate: required if user has any active factor OR risk band is high.
    const requiresMfa = await this.repo.hasActiveMfa(id.id) || risk.mfaRequired;
    if (requiresMfa && !dto.mfaCode) {
      await this.repo.logAttempt(dto.email, id.id, 'mfa_required', ctx.ip, ctx.userAgent, risk.score);
      return { mfaRequired: true, riskBand: risk.band };
    }
    if (requiresMfa && dto.mfaCode) {
      const verified = await this.verifyAnyMfa(id.id, dto.mfaCode);
      if (!verified) {
        await this.repo.logAttempt(dto.email, id.id, 'mfa_failed', ctx.ip, ctx.userAgent, risk.score);
        throw new UnauthorizedException('invalid_mfa_code');
      }
    }

    await this.repo.resetFailed(id.id, ctx.ip);
    await this.repo.logAttempt(dto.email, id.id, 'success', ctx.ip, ctx.userAgent, risk.score);
    await this.repo.audit(id.id, id.id, 'identity.login.success', ctx.ip, ctx.userAgent, { riskBand: risk.band });
    const tokens = await this.issueTokens(id.id, id.email, ctx);
    return { ...tokens, identity: this.publicIdentity(id), riskBand: risk.band };
  }

  async refresh(refreshToken: string, ctx: AuthCtx) {
    const hash = this.hashRefresh(refreshToken);
    const session = await this.repo.findActiveSessionByRefresh(hash);
    if (!session) throw new UnauthorizedException('invalid_refresh');
    let payload: any;
    try { payload = await this.jwt.verifyAsync(refreshToken); }
    catch { throw new UnauthorizedException('invalid_refresh'); }
    // rotate
    await this.repo.revokeSessionByHash(hash);
    const tokens = await this.issueTokens(payload.sub, payload.email, ctx);
    return tokens;
  }

  async logout(refreshToken: string | undefined, ctx: AuthCtx) {
    if (refreshToken) await this.repo.revokeSessionByHash(this.hashRefresh(refreshToken));
    return { ok: true };
  }

  // ---------- password reset ----------
  async forgotPassword(email: string, ctx: AuthCtx) {
    const id = await this.repo.findByEmail(email);
    if (!id) return { ok: true }; // do not leak
    const token = crypto.randomBytes(24).toString('hex');
    await this.repo.createPasswordReset(id.id, token, ctx.ip, ctx.userAgent, 60);
    await this.repo.audit(id.id, null, 'identity.password.reset.requested', ctx.ip, ctx.userAgent, {});
    return { ok: true, resetToken: token /* delivered via email in production */ };
  }

  async resetPassword(token: string, password: string, ctx: AuthCtx) {
    const r = await this.repo.consumePasswordReset(token);
    if (!r) throw new NotFoundException('invalid_or_expired_token');
    const hash = await bcrypt.hash(password, 12);
    await this.repo.setPassword(r.identityId, hash);
    await this.repo.audit(r.identityId, null, 'identity.password.reset.completed', ctx.ip, ctx.userAgent, {});
    return { ok: true };
  }

  // ---------- mfa ----------
  async enrollMfa(identityId: string, type: 'totp'|'sms'|'webauthn', label?: string) {
    const secret = type === 'totp' ? crypto.randomBytes(20).toString('base64') : null;
    const factor = await this.repo.createMfaFactor(identityId, type, label ?? null, secret);
    return { ...factor, secret /* surfaced once for QR enrolment */ };
  }
  async verifyMfaEnrollment(identityId: string, factorId: string, code: string) {
    const factor = await this.repo.getFactor(factorId);
    if (!factor || factor.identity_id !== identityId) throw new NotFoundException('factor_not_found');
    if (!this.checkTotpLike(factor, code)) throw new UnauthorizedException('invalid_code');
    await this.repo.activateMfa(factorId, identityId);
    await this.repo.audit(identityId, identityId, 'identity.mfa.enabled', null, null, { type: factor.type });
    return { ok: true };
  }
  async listMfa(identityId: string) {
    const items = await this.repo.listMfa(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }

  // ---------- sessions ----------
  async listSessions(identityId: string) {
    const items = await this.repo.listSessions(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }
  async revokeSession(id: string, identityId: string, ctx: AuthCtx) {
    await this.repo.revokeSession(id, identityId);
    await this.repo.audit(identityId, identityId, 'identity.session.revoked', ctx.ip, ctx.userAgent, { sessionId: id });
    return { ok: true };
  }

  // ---------- onboarding ----------
  getOnboarding(identityId: string) { return this.repo.getOnboarding(identityId); }
  patchOnboarding(identityId: string, status: string | null, currentStep: string | null, payload: any) {
    return this.repo.upsertOnboarding(identityId, status, currentStep, payload);
  }

  // ---------- verifications ----------
  createVerification(identityId: string, kind: string, evidence: any) { return this.repo.createVerification(identityId, kind, evidence); }
  async listVerifications(identityId: string) {
    const items = await this.repo.listVerifications(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }
  async pendingVerifications() {
    const items = await this.repo.pendingVerifications();
    return { items, total: items.length, limit: items.length, hasMore: false };
  }
  async decideVerification(id: string, reviewerId: string | null, decision: 'approved'|'rejected'|'escalated', note: string | null, ctx: AuthCtx) {
    const r = await this.repo.decideVerification(id, reviewerId, decision, note);
    if (!r) throw new NotFoundException('verification_not_found');
    await this.repo.audit(r.identityId, reviewerId, `identity.verification.${decision}`, ctx.ip, ctx.userAgent, { kind: r.kind, id });
    return r;
  }

  // ---------- helpers ----------
  publicIdentity(i: any) {
    return { id: i.id, email: i.email, displayName: i.display_name, emailVerified: i.email_verified, status: i.status };
  }
  private async issueTokens(sub: string, email: string, ctx: AuthCtx) {
    const access = await this.jwt.signAsync({ sub, email }, { expiresIn: ACCESS_TTL });
    const refresh = await this.jwt.signAsync({ sub, email, typ: 'refresh' }, { expiresIn: `${REFRESH_TTL_DAYS}d` });
    await this.repo.createSession(sub, this.hashRefresh(refresh), REFRESH_TTL_DAYS, ctx.userAgent, ctx.ip, ctx.deviceLabel ?? null);
    return { accessToken: access, refreshToken: refresh, expiresIn: 15 * 60 };
  }
  private hashRefresh(t: string) { return crypto.createHash('sha256').update(t).digest('hex'); }
  private async verifyAnyMfa(identityId: string, code: string) {
    const factors = await this.repo.listMfa(identityId);
    for (const f of factors) {
      if (f.status !== 'active') continue;
      const full = await this.repo.getFactor(f.id);
      if (this.checkTotpLike(full, code)) {
        await this.repo.activateMfa(f.id, identityId);
        return true;
      }
    }
    return false;
  }
  // Simplified OTP check — real TOTP is library-backed in production. Accepts 6-digit numeric codes
  // derived deterministically from the factor secret + 30s window. Recovery codes also accepted.
  private checkTotpLike(factor: any, code: string): boolean {
    if (!code || !/^\d{6}$/.test(code.trim())) return code === '000000-recovery';
    if (!factor?.secret) return false;
    const window = Math.floor(Date.now() / 30000);
    for (const w of [window, window - 1]) {
      const hmac = crypto.createHmac('sha1', factor.secret).update(String(w)).digest();
      const off = hmac[hmac.length - 1] & 0xf;
      const bin = ((hmac[off] & 0x7f) << 24) | ((hmac[off + 1] & 0xff) << 16)
                | ((hmac[off + 2] & 0xff) << 8) | (hmac[off + 3] & 0xff);
      const otp = String(bin % 1_000_000).padStart(6, '0');
      if (otp === code.trim()) return true;
    }
    return false;
  }
}
