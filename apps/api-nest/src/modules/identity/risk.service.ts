import { Injectable, Logger } from '@nestjs/common';
import { IdentityRepository } from './identity.repository';

/**
 * Risk scoring for login attempts.
 * - Calls the Python analytics service at ANALYTICS_URL when available.
 * - Falls back to a deterministic local scorer so login flows never block
 *   on ML availability (Domain 03 spec: "deterministic fallback behaviour").
 */
@Injectable()
export class RiskService {
  private readonly log = new Logger(RiskService.name);
  constructor(private readonly repo: IdentityRepository) {}

  async scoreLogin(input: {
    email: string;
    ip: string | null;
    userAgent: string | null;
    knownIdentity: boolean;
  }): Promise<{ score: number; band: 'low'|'medium'|'high'; reasons: string[]; mfaRequired: boolean }> {
    const recent = await this.repo.recentAttempts(input.email, input.ip, 60);
    const counts = Object.fromEntries(recent.map(r => [r.outcome, r.c]));
    const features = {
      email: input.email,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      knownIdentity: input.knownIdentity,
      recent_failed: counts['bad_password'] ?? 0,
      recent_locked: counts['locked'] ?? 0,
      recent_success: counts['success'] ?? 0,
      recent_blocked: counts['blocked'] ?? 0,
    };

    const url = process.env.ANALYTICS_URL;
    if (url) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 800);
        const r = await fetch(`${url.replace(/\/$/, '')}/identity/risk/score`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(features),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (r.ok) {
          const j = await r.json();
          if (typeof j?.score === 'number') return j;
        }
      } catch (e: any) {
        this.log.warn(`risk service unavailable: ${e?.message ?? e}`);
      }
    }
    return this.localScore(features);
  }

  private localScore(f: any) {
    let s = 0;
    const reasons: string[] = [];
    if (f.recent_failed >= 3) { s += 35; reasons.push(`${f.recent_failed} failed attempts in last hour`); }
    if (f.recent_failed >= 5) { s += 25; reasons.push('repeated failures from this email/ip'); }
    if (f.recent_blocked >= 1) { s += 25; reasons.push('previous block within window'); }
    if (!f.knownIdentity) { s += 10; reasons.push('email not previously seen'); }
    if (!f.ip) { s += 5; reasons.push('missing ip'); }
    if (!f.userAgent) { s += 5; reasons.push('missing user agent'); }
    s = Math.min(100, s);
    const band = s >= 70 ? 'high' : s >= 35 ? 'medium' : 'low';
    return { score: s, band, reasons, mfaRequired: band === 'high' };
  }
}
