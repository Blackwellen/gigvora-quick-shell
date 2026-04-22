import { BadRequestException } from '@nestjs/common';
import { SettingsService } from '../src/modules/settings/settings.service';

function makeRepo() {
  const store = new Map<string, any>();
  const audit: any[] = [];
  const repo: any = {
    list: jest.fn(async (id: string, ns?: string) => Array.from(store.values()).filter((s: any) => s.identity_id === id && (!ns || s.namespace === ns))),
    getOne: jest.fn(async (id: string, ns: string, k: string) => store.get(`${id}:${ns}:${k}`)),
    upsert: jest.fn(async (id: string, _actor: any, dto: any) => {
      const old = store.get(`${id}:${dto.namespace}:${dto.key}`);
      const row = { id: `s${store.size + 1}`, identity_id: id, ...dto };
      store.set(`${id}:${dto.namespace}:${dto.key}`, row);
      audit.push({ identity_id: id, namespace: dto.namespace, key: dto.key, old: old?.value ?? null, new: dto.value });
      return row;
    }),
    resetNamespace: jest.fn(async (id: string, ns: string) => { const removed: any[] = []; for (const [k, v] of store) if ((v as any).identity_id === id && (v as any).namespace === ns) { removed.push({ key: (v as any).key }); store.delete(k); } return removed; }),
    audit: jest.fn(async (id: string) => audit.filter(a => a.identity_id === id)),
    listLocales: jest.fn(async () => [{ code: 'en-GB' }]),
    listTimezones: jest.fn(async () => [{ code: 'Europe/London' }]),
    listConnectedAccounts: jest.fn(async () => []),
    createConnectedAccount: jest.fn(async (id: string, p: any) => ({ id: 'c1', identity_id: id, ...p })),
    revokeConnectedAccount: jest.fn(async () => [{ id: 'c1' }]),
    createDataRequest: jest.fn(async (id: string, kind: string) => ({ id: 'd1', identity_id: id, kind, status: 'pending' })),
    listDataRequests: jest.fn(async () => []),
  };
  return { repo, store, audit };
}

describe('SettingsService', () => {
  it('upserts a valid setting and writes an audit row', async () => {
    const { repo, audit } = makeRepo();
    const svc = new SettingsService(repo);
    const row = await svc.upsert('u1', { namespace: 'general', key: 'theme', value: 'dark' } as any);
    expect(row.value).toBe('dark');
    expect(audit).toHaveLength(1);
    expect(audit[0].new).toBe('dark');
  });

  it('rejects an out-of-range font_scale', async () => {
    const svc = new SettingsService(makeRepo().repo);
    await expect(svc.upsert('u1', { namespace: 'accessibility', key: 'font_scale', value: 5 } as any))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an unknown theme value', async () => {
    const svc = new SettingsService(makeRepo().repo);
    await expect(svc.upsert('u1', { namespace: 'general', key: 'theme', value: 'neon' } as any))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('bulk upserts accumulate audit history', async () => {
    const { repo, audit } = makeRepo();
    const svc = new SettingsService(repo);
    await svc.bulkUpsert('u1', { items: [
      { namespace: 'general', key: 'theme', value: 'light' },
      { namespace: 'general', key: 'density', value: 'compact' },
    ] } as any);
    expect(audit).toHaveLength(2);
  });

  it('resetNamespace clears all keys for the namespace', async () => {
    const { repo } = makeRepo();
    const svc = new SettingsService(repo);
    await svc.upsert('u1', { namespace: 'general', key: 'theme', value: 'dark' } as any);
    const out = await svc.resetNamespace('u1', { namespace: 'general' } as any);
    expect(out.length).toBeGreaterThan(0);
  });

  it('createDataRequest returns a pending record', async () => {
    const svc = new SettingsService(makeRepo().repo);
    const r = await svc.createDataRequest('u1', { kind: 'export' } as any);
    expect(r.status).toBe('pending');
  });
});
