import { describe, it, expect } from 'vitest';
import { OutboundWebhookPublisher } from '../../apps/api-nest/src/modules/outbound-webhooks/outbound-webhooks.publisher';
import { verifySignature } from '../../packages/sdk/src/webhooks';

describe('outbound webhooks', () => {
  it('signs, delivers, and verifies HMAC', async () => {
    let received: { headers: Record<string, string>; body: string } | null = null;
    const fetchImpl = (async (_url: string, init: any) => {
      received = { headers: init.headers, body: init.body };
      return new Response('ok', { status: 200 });
    }) as unknown as typeof fetch;

    const pub = new OutboundWebhookPublisher(fetchImpl);
    const sub = pub.upsertSubscription({ tenantId: 't1', url: 'https://example.test/hook', events: [], active: true });
    await pub.publish({ tenantId: 't1', event: 'interview.transitioned', entityType: 'interview', entityId: 'iv-1', payload: { next: 'completed' } });

    await new Promise((r) => setTimeout(r, 10));
    expect(received).toBeTruthy();
    const sig = received!.headers['x-gigvora-signature'];
    const v = await verifySignature({ rawBody: received!.body, signatureHeader: sig, secret: sub.secret });
    expect(v.ok).toBe(true);
  });

  it('dedupes by dedupeKey', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (_u: string, init: any) => { calls.push(init.body); return new Response('ok'); }) as unknown as typeof fetch;
    const pub = new OutboundWebhookPublisher(fetchImpl);
    pub.upsertSubscription({ tenantId: 't1', url: 'https://x/y', events: [], active: true });
    const args = { tenantId: 't1', event: 'card.moved' as const, entityType: 'card', entityId: 'c1', payload: {}, dedupeKey: 'k1' };
    await pub.publish(args); await pub.publish(args);
    await new Promise((r) => setTimeout(r, 10));
    expect(calls.length).toBe(1);
  });

  it('replays a delivery from log', async () => {
    let n = 0;
    const fetchImpl = (async () => { n++; return new Response(n === 1 ? 'fail' : 'ok', { status: n === 1 ? 500 : 200 }); }) as unknown as typeof fetch;
    const pub = new OutboundWebhookPublisher(fetchImpl);
    pub.upsertSubscription({ tenantId: 't1', url: 'https://x/y', events: [], active: true });
    await pub.publish({ tenantId: 't1', event: 'scorecard.submitted', entityType: 'scorecard', entityId: 's1', payload: {} });
    await new Promise((r) => setTimeout(r, 10));
    const [d] = pub.listDeliveries('t1');
    expect(d.status).toBe('pending'); // queued for retry
    await pub.replay(d.id);
    await new Promise((r) => setTimeout(r, 10));
    expect(pub.listDeliveries('t1')[0].status).toBe('success');
  });
});
