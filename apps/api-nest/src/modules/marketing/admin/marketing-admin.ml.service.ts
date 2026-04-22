import { Injectable, Logger } from '@nestjs/common';

const ML_BASE       = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';
const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const TIMEOUT_MS = 1500;

async function tryFetch<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}

/**
 * Marketing-Admin ML bridge.
 * Calls deterministic Python services (botdetect, ads_ops, marketing analytics)
 * and falls back to a deterministic in-process score if the service is down,
 * preserving the locked envelope so the FE never sees a null.
 */
@Injectable()
export class MarketingAdminMlService {
  private readonly logger = new Logger(MarketingAdminMlService.name);

  /** Score an ad creative through ml-python /ads-ops/score-creative + fallback. */
  async scoreCreative(p: {
    advertiser: string; title: string; description?: string;
    landingUrl?: string; format: string; meta?: Record<string, unknown>;
  }): Promise<{ score: number; risk: 'low'|'medium'|'high'|'critical'; flags: any[]; components: any; model: string }> {
    const ml = await tryFetch<any>(`${ML_BASE}/ads-ops/score-creative`, {
      advertiserId: p.advertiser,
      creativeKind: p.format,
      headline: p.title,
      body: p.description ?? '',
      landingUrl: p.landingUrl ?? '',
      keywords: [],
    });
    if (ml) {
      const score = Number(ml.score ?? 0);
      const band  = String(ml.band ?? 'normal');
      const risk  = (band === 'critical') ? 'critical' : band === 'high' ? 'high' : band === 'elevated' ? 'medium' : 'low';
      return {
        score, risk: risk as any,
        flags: Array.isArray(ml.flags) ? ml.flags : [],
        components: { reasons: ml.reasons ?? [], source: 'ads_ops/ml-python' },
        model: 'ads_ops-ml-python',
      };
    }
    // Deterministic fallback so envelope is never empty.
    const text = `${p.title} ${p.description ?? ''} ${p.landingUrl ?? ''}`.toLowerCase();
    let s = 10; const flags: any[] = [];
    const checks: Array<[RegExp, string, number, 'low'|'medium'|'high'|'critical']> = [
      [/guaranteed|2x roi|miracle|risk[- ]free/i, 'unsubstantiated_claim', 35, 'high'],
      [/crypto|bitcoin|nft/i,                      'crypto_unregistered',   40, 'critical'],
      [/competitor|pre-vetted/i,                    'competing_marketplace', 20, 'medium'],
      [/cbd|cannabis/i,                             'controlled_substance',  30, 'high'],
    ];
    for (const [re, code, w, sev] of checks) if (re.test(text)) { s += w; flags.push({ code, severity: sev, source: 'fallback' }); }
    const risk = s >= 80 ? 'critical' : s >= 55 ? 'high' : s >= 30 ? 'medium' : 'low';
    return { score: Math.min(100, s), risk, flags, components: { source: 'deterministic-fallback' }, model: 'ads-ops-deterministic' };
  }

  /** Pull funnel summary (analytics-python /marketing/funnel/summary) with fallback. */
  async funnelSummary(input: { impressions: number; clicks: number; leads: number; conversions: number }) {
    const r = await tryFetch<any>(`${ANALYTICS_BASE}/marketing/funnel/summary`, input);
    if (r) return { ...r, model: 'marketing-analytics-python' };
    const ctr = input.impressions ? input.clicks / input.impressions : 0;
    const lead_rate = input.clicks ? input.leads / input.clicks : 0;
    const conv = input.leads ? input.conversions / input.leads : 0;
    const health = ctr >= 0.04 && conv >= 0.10 ? 'healthy' : ctr < 0.01 ? 'critical' : 'warning';
    return { ctr, lead_rate, conversion_rate: conv, health, insight: 'Deterministic fallback computed in-process.', model: 'marketing-analytics-deterministic' };
  }

  /** IP bot scoring via /botdetect/score with deterministic fallback. */
  async scoreIp(input: {
    subjectId: string; actionsPerMinute?: number; identicalPayloadRatio?: number;
    timeToFirstActionMs?: number; uaEntropy?: number; headless?: boolean;
    mouseEvents?: number; ipReputation?: number; accountsPerDevice?: number;
  }) {
    const r = await tryFetch<any>(`${ML_BASE}/botdetect/score`, {
      subject_id: input.subjectId,
      actions_per_minute: input.actionsPerMinute ?? 0,
      identical_payload_ratio: input.identicalPayloadRatio ?? 0,
      time_to_first_action_ms: input.timeToFirstActionMs ?? 1000,
      ua_entropy: input.uaEntropy ?? 0.5,
      headless_browser_flag: !!input.headless,
      mouse_event_count_per_session: input.mouseEvents ?? 50,
      ip_reputation: input.ipReputation ?? 0,
      accounts_per_device_30d: input.accountsPerDevice ?? 1,
    });
    if (r) return { ...r, source: 'botdetect-ml-python' };
    // Deterministic fallback: blend of inputs.
    const score = Math.min(1,
      (input.headless ? 0.3 : 0) +
      (input.ipReputation ?? 0) * 0.4 +
      Math.min(1, (input.actionsPerMinute ?? 0) / 60) * 0.2 +
      (input.identicalPayloadRatio ?? 0) * 0.1,
    );
    const band = score >= 0.85 ? 'critical' : score >= 0.65 ? 'high' : score >= 0.4 ? 'medium' : 'low';
    return { score: Number(score.toFixed(3)), band, components: [], source: 'botdetect-deterministic' };
  }
}
