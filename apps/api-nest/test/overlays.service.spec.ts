import { OverlaysService } from '../src/modules/overlays/overlays.service';

// Fake repository — exercises the service's branching without a live DB.
function makeRepo() {
  const audit: any[] = [];
  let session: any = null;
  let workflow: any = null;
  const steps: any[] = [];
  const repo: any = {
    audit: jest.fn(async (e) => { audit.push(e); }),
    open: jest.fn(async (r) => (session = { id: 's1', identity_id: r.identityId, ...r, status: 'open' })),
    get: jest.fn(async () => session),
    patch: jest.fn(async (id, p) => (session = { ...session, ...p, id })),
    listOpen: jest.fn(async () => (session ? [session] : [])),
    startWorkflow: jest.fn(async (id, key, total, first) => (workflow = { id: 'w1', identity_id: id, template_key: key, total_steps: total, current_step: first, status: 'active' })),
    advanceWorkflow: jest.fn(async () => workflow),
    getWorkflow: jest.fn(async () => ({ ...workflow, steps })),
    listWorkflows: jest.fn(async () => (workflow ? [workflow] : [])),
    detach: jest.fn(async (id, ch) => ({ id: 'd1', identity_id: id, channel_key: ch })),
    pingWindow: jest.fn(async (id, ch, st) => ({ id: 'd1', identity_id: id, channel_key: ch, state: st })),
    closeWindow: jest.fn(async () => ({ ok: true })),
    listWindows: jest.fn(async () => []),
    ds: { query: jest.fn(async (sql: string, p: any[]) => steps.push({ workflow_id: p[0], step_key: p[1], position: p[2] })) },
  };
  return { repo, audit, getSteps: () => steps };
}

describe('OverlaysService', () => {
  it('opens an overlay and writes audit', async () => {
    const { repo, audit } = makeRepo();
    const svc = new OverlaysService(repo);
    const out = await svc.open('u1', { kind: 'drawer', surfaceKey: 'jobs.editor' } as any);
    expect(out.identity_id).toBe('u1');
    expect(audit[0].action).toBe('opened');
  });

  it('forbids patching another user’s overlay', async () => {
    const { repo } = makeRepo();
    repo.open({ identityId: 'owner', kind: 'drawer', surfaceKey: 's' });
    const svc = new OverlaysService(repo);
    await expect(svc.patch('intruder', 's1', { status: 'dismissed' } as any)).rejects.toThrow();
  });

  it('records completion in audit when patched to a terminal status', async () => {
    const { repo, audit } = makeRepo();
    await repo.open({ identityId: 'u1', kind: 'drawer', surfaceKey: 's' });
    const svc = new OverlaysService(repo);
    await svc.patch('u1', 's1', { status: 'completed', result: { ok: true } } as any);
    expect(audit.find(a => a.action === 'completed')).toBeTruthy();
  });

  it('rejects unknown workflow templates', async () => {
    const { repo } = makeRepo();
    const svc = new OverlaysService(repo);
    await expect(svc.startWorkflow('u1', { templateKey: 'no_such_template' } as any)).rejects.toThrow(/unknown template/);
  });

  it('starts a workflow and pre-creates step rows', async () => {
    const { repo, getSteps } = makeRepo();
    const svc = new OverlaysService(repo);
    const wf = await svc.startWorkflow('u1', { templateKey: 'purchase_followup' } as any);
    expect(wf.template_key).toBe('purchase_followup');
    expect(wf.total_steps).toBe(4);
    expect(getSteps()).toHaveLength(4);
    expect(getSteps()[0].step_key).toBe('checkout_success');
  });

  it('detaches and pings windows', async () => {
    const { repo } = makeRepo();
    const svc = new OverlaysService(repo);
    const w = await svc.detach('u1', { channelKey: 'dw1', surfaceKey: 'inbox', route: '/messages' } as any);
    expect(w.channel_key).toBe('dw1');
    const p = await svc.pingWindow('u1', 'dw1', { state: { unread: 2 } } as any);
    expect(p.state.state.unread).toBe(2);
  });
});
