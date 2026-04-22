import { test, expect } from '@playwright/test';

test.describe('Cross-cutting integrations (D30)', () => {
  test('adapter map exposes per-domain entries', async ({ request }) => {
    const r = await request.get('/api/v1/integrations/adapter-map');
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    for (const d of ['D24', 'D25', 'D26', 'D27', 'D28', 'D29']) expect(body[d]).toBeTruthy();
    const d29 = body.D29.find((e: any) => e.category === 'calendar');
    expect(d29.default).toBe('ics-native');
    expect(d29.optIn).toContain('google-calendar');
  });

  test('cross-domain catalog lists every wired link', async ({ request }) => {
    const r = await request.get('/api/v1/domain-bus/catalog');
    const { links } = await r.json();
    const events = links.map((l: any) => l.source);
    expect(events).toEqual(expect.arrayContaining([
      'posting.published', 'application.submitted', 'prospect.status.changed',
      'card.moved', 'interview.transitioned', 'scorecard.submitted', 'outreach.sent',
    ]));
  });

  test('webhook subscribe + delivery list responds', async ({ request }) => {
    const sub = await request.post('/api/v1/webhook-subscriptions', {
      data: { url: 'https://example.test/hook', events: [] },
    }).then((r) => r.json());
    expect(sub.id).toBeTruthy();
    const list = await request.get('/api/v1/webhook-subscriptions').then((r) => r.json());
    expect(list.find((s: any) => s.id === sub.id)).toBeTruthy();
    const deliv = await request.get('/api/v1/webhook-deliveries').then((r) => r.json());
    expect(Array.isArray(deliv)).toBe(true);
  });
});
