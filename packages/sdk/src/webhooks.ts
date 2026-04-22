/**
 * SDK helpers consumed by web hooks, Flutter and external integrators:
 *  - verifySignature() for tenants receiving outbound webhooks
 *  - typed contracts for subscriptions + delivery logs
 *  - typed event names per domain
 */
export type WebhookEvent =
  | 'posting.published' | 'posting.paused' | 'posting.archived' | 'credits.purchased' | 'credits.consumed'
  | 'application.submitted' | 'application.advanced' | 'application.rejected' | 'application.withdrawn'
  | 'requisition.opened' | 'requisition.approved' | 'requisition.closed'
  | 'search.saved' | 'prospect.added' | 'prospect.status.changed' | 'outreach.sent' | 'outreach.replied'
  | 'card.created' | 'card.moved' | 'card.note.added' | 'card.mention'
  | 'interview.created' | 'interview.transitioned' | 'interview.rescheduled' | 'interviewer.responded'
  | 'scorecard.drafted' | 'scorecard.submitted' | 'scorecard.withdrawn'
  | 'calibration.opened' | 'calibration.decided'
  | 'panel.created' | 'panel.updated' | 'panel.status';

export interface WebhookSubscription {
  id: string; tenantId: string; url: string; secret: string;
  events: WebhookEvent[]; active: boolean; createdAt: string;
}
export interface DeliveryLog {
  id: string; subscriptionId: string; event: WebhookEvent;
  entityType: string; entityId: string; attempt: number;
  status: 'pending' | 'success' | 'failed' | 'dlq';
  httpCode?: number; latencyMs?: number; nextRetryAt?: string;
  payload: any; dedupeKey: string; createdAt: string; updatedAt: string;
}

const SKEW_SEC = 5 * 60;

/** Verify an outbound webhook signature on the consumer side. */
export async function verifySignature(args: {
  rawBody: string;
  signatureHeader: string;       // "t=<ts>,v1=<sig>"
  secret: string;
  now?: number;                  // seconds, for tests
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { rawBody, signatureHeader, secret } = args;
  const now = args.now ?? Math.floor(Date.now() / 1000);
  const parts = Object.fromEntries(signatureHeader.split(',').map((kv) => kv.split('=')));
  const ts = Number(parts.t); const v1 = parts.v1;
  if (!ts || !v1) return { ok: false, reason: 'malformed-signature' };
  if (Math.abs(now - ts) > SKEW_SEC) return { ok: false, reason: 'stale-timestamp' };
  const enc = new TextEncoder();
  const keyData = enc.encode(secret); const msg = enc.encode(`${ts}.${rawBody}`);
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, msg);
  const expected = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (expected !== v1) return { ok: false, reason: 'bad-signature' };
  return { ok: true };
}

/** Typed client for subscriptions + deliveries (used by every workbench). */
export function createWebhooksClient(fetchImpl: typeof fetch = fetch, base = '/api/v1') {
  const json = async (r: Response) => { if (!r.ok) throw new Error(await r.text()); return r.json(); };
  return {
    listSubscriptions: (tenantId = 'tenant-demo') =>
      fetchImpl(`${base}/webhook-subscriptions?tenantId=${tenantId}`).then(json) as Promise<WebhookSubscription[]>,
    createSubscription: (body: { tenantId?: string; url: string; events?: WebhookEvent[]; active?: boolean }) =>
      fetchImpl(`${base}/webhook-subscriptions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(json),
    rotateSecret: (id: string) =>
      fetchImpl(`${base}/webhook-subscriptions/${id}/rotate-secret`, { method: 'POST' }).then(json),
    deactivate: (id: string) =>
      fetchImpl(`${base}/webhook-subscriptions/${id}`, { method: 'DELETE' }).then(json),
    listDeliveries: (q: { tenantId?: string; event?: WebhookEvent; status?: DeliveryLog['status'] } = {}) => {
      const p = new URLSearchParams(); Object.entries(q).forEach(([k, v]) => v && p.set(k, String(v)));
      return fetchImpl(`${base}/webhook-deliveries?${p}`).then(json) as Promise<DeliveryLog[]>;
    },
    replay: (id: string) => fetchImpl(`${base}/webhook-deliveries/${id}/replay`, { method: 'POST' }).then(json),
  };
}
