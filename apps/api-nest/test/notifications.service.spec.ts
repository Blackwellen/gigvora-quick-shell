import { NotificationsService } from '../src/modules/notifications/notifications.service';

function makeRepo() {
  let lastId = 0;
  const notifs: any[] = [];
  const deliveries: any[] = [];
  const prefs: any[] = [];
  const badges = new Map<string, any>();
  const activity: any[] = [];
  const repo: any = {
    create: jest.fn(async (dto) => { const n = { id: `n${++lastId}`, ...dto, status: 'sent', read_at: null, dismissed_at: null }; notifs.push(n); return n; }),
    list:   jest.fn(async (id) => notifs.filter(n => n.identityId === id)),
    unreadCount: jest.fn(async (id) => notifs.filter(n => n.identityId === id && !n.read_at && !n.dismissed_at).length),
    markRead: jest.fn(async (id, ids) => { const updated: any[] = []; for (const n of notifs) if (n.identityId === id && ids.includes(n.id) && !n.read_at) { n.read_at = new Date(); updated.push({ id: n.id }); } return updated; }),
    markAllRead: jest.fn(async (id) => { const u: any[] = []; for (const n of notifs) if (n.identityId === id && !n.read_at) { n.read_at = new Date(); u.push({ id: n.id }); } return u; }),
    dismiss: jest.fn(async (id, nid) => { const n = notifs.find(x => x.id === nid && x.identityId === id); if (n) n.dismissed_at = new Date(); return n; }),
    recordDelivery: jest.fn(async (nid, ch, status) => { const d = { id: `d${deliveries.length + 1}`, notification_id: nid, channel: ch, status }; deliveries.push(d); return d; }),
    listDeliveries: jest.fn(async (nid) => deliveries.filter(d => d.notification_id === nid)),
    listPreferences: jest.fn(async () => prefs),
    upsertPreference: jest.fn(async (id, p) => { prefs.push({ identity_id: id, ...p }); return prefs[prefs.length - 1]; }),
    setBadge: jest.fn(async (id, key, count, variant = 'default') => { const b = { identity_id: id, surface_key: key, count, variant }; badges.set(`${id}:${key}`, b); return b; }),
    listBadges: jest.fn(async (id) => Array.from(badges.values()).filter(b => b.identity_id === id)),
    emitActivity: jest.fn(async (row) => { const e = { id: `a${activity.length + 1}`, ...row, surface_keys: row.surfaceKeys ?? [] }; activity.push(e); return e; }),
    listActivity: jest.fn(async (id) => activity.filter(a => !a.identityId || a.identityId === id)),
    registerDevice: jest.fn(async (id, p, t) => ({ id: 'dev1', identity_id: id, platform: p, token: t })),
    revokeDevice: jest.fn(async () => ({ ok: true })),
    listDevices: jest.fn(async () => []),
    createWebhook: jest.fn(async (id, p, u, s) => ({ id: 'w1', identity_id: id, topic_pattern: p, url: u, secret: s, active: true })),
    listWebhooks: jest.fn(async () => []),
    revokeWebhook: jest.fn(async () => [{ id: 'w1' }]),
  };
  return { repo, notifs, deliveries, badges, activity };
}

function makeGateway() {
  return {
    emits: [] as any[],
    emitToUser:   function (id: string, ev: string, p: any) { (this.emits as any[]).push({ scope: 'user',   id, ev, p }); },
    emitToTopic:  function (t: string, ev: string, p: any)  { (this.emits as any[]).push({ scope: 'topic',  t, ev, p }); },
    emitToEntity: function (et: string, ei: string, ev: string, p: any) { (this.emits as any[]).push({ scope: 'entity', et, ei, ev, p }); },
    presenceCount: () => 1,
  } as any;
}

describe('NotificationsService', () => {
  it('creates a notification, fans out, bumps badge, emits realtime', async () => {
    const { repo } = makeRepo();
    const gw = makeGateway();
    const svc = new NotificationsService(repo, gw);
    const n = await svc.create({ identityId: 'u1', topic: 'order.completed', title: 'Paid' } as any);
    expect(n.id).toBe('n1');
    expect(repo.recordDelivery).toHaveBeenCalledWith('n1', 'in_app', 'delivered', undefined);
    expect(gw.emits.find((e: any) => e.ev === 'notification.created')).toBeTruthy();
    const badge = gw.emits.find((e: any) => e.ev === 'badge.updated');
    expect(badge.p.count).toBe(1);
  });

  it('respects a wildcard preference for channel selection', async () => {
    const { repo } = makeRepo();
    const gw = makeGateway();
    const svc = new NotificationsService(repo, gw);
    await svc.upsertPreference('u1', { topic: '*', channels: ['in_app', 'email'] } as any);
    await svc.create({ identityId: 'u1', topic: 'message.new', title: 'Hi' } as any);
    const channels = repo.recordDelivery.mock.calls.map((c: any[]) => c[1]);
    expect(channels).toContain('in_app');
    expect(channels).toContain('email');
  });

  it('mark-all-read zeroes the badge and emits the update', async () => {
    const { repo } = makeRepo();
    const gw = makeGateway();
    const svc = new NotificationsService(repo, gw);
    await svc.create({ identityId: 'u1', topic: 't', title: 'a' } as any);
    await svc.create({ identityId: 'u1', topic: 't', title: 'b' } as any);
    const out = await svc.markAllRead('u1');
    expect(out.unreadCount).toBe(0);
    const last = [...gw.emits].reverse().find((e: any) => e.ev === 'badge.updated');
    expect(last.p.count).toBe(0);
  });

  it('emits activity events to user, topic, and entity rooms', async () => {
    const { repo } = makeRepo();
    const gw = makeGateway();
    const svc = new NotificationsService(repo, gw);
    await svc.emitActivity('actor1', { topic: 'message.new', verb: 'created', entityType: 'thread', entityId: 'thr_1', identityId: 'u1', surfaceKeys: ['inbox'] } as any);
    expect(gw.emits.find((e: any) => e.scope === 'user'   && e.ev === 'activity.event')).toBeTruthy();
    expect(gw.emits.find((e: any) => e.scope === 'topic'  && e.ev === 'activity.event')).toBeTruthy();
    expect(gw.emits.find((e: any) => e.scope === 'entity' && e.ev === 'activity.event')).toBeTruthy();
  });

  it('issues a webhook secret only on creation', async () => {
    const { repo } = makeRepo();
    const svc = new NotificationsService(repo, makeGateway());
    const wh = await svc.createWebhook('u1', { topicPattern: 'order.*', url: 'https://example.com/h' } as any);
    expect(wh.secret).toMatch(/^whsec_/);
  });
});
