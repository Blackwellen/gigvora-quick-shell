import { Test } from '@nestjs/testing';
import { WorkspaceService } from '../src/modules/workspace/workspace.service';
import { WorkspaceRepository } from '../src/modules/workspace/workspace.repository';
import { AuditService } from '../src/modules/workspace/audit.service';

describe('WorkspaceService', () => {
  const repo: any = {
    listOrgsForUser: jest.fn().mockResolvedValue([{ id: 'o1', slug: 'a', name: 'Acme', plan: 'team', status: 'active', role: 'owner' }]),
    getPrefs: jest.fn().mockResolvedValue([]),
    listSavedViews: jest.fn().mockResolvedValue([]),
    listRecents: jest.fn().mockResolvedValue([]),
    getNavTree: jest.fn().mockResolvedValue([]),
    insertSavedView: jest.fn().mockResolvedValue([{ id: 'v1', label: 'X', route: '/x', pinned: false, position: 0, filters: {} }]),
    updateSavedView: jest.fn().mockResolvedValue([{ id: 'v1', label: 'Y', route: '/x', pinned: true, position: 0, filters: {} }]),
    deleteSavedView: jest.fn().mockResolvedValue(undefined),
    trackRecent: jest.fn().mockResolvedValue(undefined),
    upsertPrefs: jest.fn().mockResolvedValue([{ userId: 'u', activeRole: 'professional', activeOrgId: 'o1' }]),
    createOrg: jest.fn().mockResolvedValue({ id: 'o2', slug: 'new', name: 'New', plan: 'free', status: 'active', role: 'owner' }),
  };
  const audit: any = { record: jest.fn().mockResolvedValue(undefined) };
  let svc: WorkspaceService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: WorkspaceRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();
    svc = mod.get(WorkspaceService);
  });

  it('bootstrap returns merged shell payload with default prefs', async () => {
    const out = await svc.bootstrap('u1');
    expect(out.orgs).toHaveLength(1);
    expect(out.prefs.activeRole).toBe('user');
    expect(out.prefs.activeOrgId).toBe('o1');
  });

  it('createSavedView writes audit', async () => {
    const v = await svc.createSavedView('u1', { label: 'X', route: '/x' } as any);
    expect(v.id).toBe('v1');
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'savedView.create' }));
  });

  it('updatePrefs records role switch', async () => {
    await svc.updatePrefs('u1', { activeRole: 'professional' } as any);
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'shell.role.switch' }));
  });

  it('createOrg returns org with owner role', async () => {
    const o = await svc.createOrg('u1', { name: 'New', slug: 'new' } as any);
    expect(o.role).toBe('owner');
  });
});
