import { Test } from '@nestjs/testing';
import { EntitlementsService } from '../src/modules/entitlements/entitlements.service';
import { EntitlementsRepository } from '../src/modules/entitlements/entitlements.repository';

describe('EntitlementsService', () => {
  let svc: EntitlementsService;
  const ctx = { ip: '1.1.1.1', userAgent: 'jest' };
  const repo = {
    listPlans: jest.fn(),
    getPlan: jest.fn(),
    upsertPlan: jest.fn(),
    listGrantsForIdentity: jest.fn(),
    grantRole: jest.fn(),
    revokeRole: jest.fn(),
    listSubscriptions: jest.fn(),
    getSubscription: jest.fn(),
    createSubscription: jest.fn(),
    changeSubscriptionPlan: jest.fn(),
    cancelSubscription: jest.fn(),
    listActiveOverrides: jest.fn(),
    createOverride: jest.fn(),
    revokeOverride: jest.fn(),
    logAccess: jest.fn(),
    recentDenials: jest.fn(),
    logRoleSwitch: jest.fn(),
  };

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [EntitlementsService, { provide: EntitlementsRepository, useValue: repo }],
    }).compile();
    svc = mod.get(EntitlementsService);
  });
  beforeEach(() => jest.clearAllMocks());

  it('resolves plan entitlements + overrides into effective set', async () => {
    repo.listGrantsForIdentity.mockResolvedValue([{ role: 'professional', orgId: null }]);
    repo.listSubscriptions.mockResolvedValueOnce([{ plan_id: 'pro' }]).mockResolvedValueOnce([]);
    repo.listActiveOverrides.mockResolvedValue([
      { feature: 'sales-navigator', grant: true, reason: 'beta' },
      { feature: 'ads-manager', grant: false, reason: 'abuse' },
    ]);
    repo.getPlan.mockResolvedValue({ id: 'pro', label: 'Pro', entitlements: ['recruiter-pro','ads-manager','advanced-analytics'], limits: {} });
    const r = await svc.resolve('u1');
    expect(r.entitlements).toContain('recruiter-pro');
    expect(r.entitlements).toContain('sales-navigator');     // override added
    expect(r.entitlements).not.toContain('ads-manager');     // override removed
    expect(r.activeRole).toBe('professional');
    expect(r.plan?.id).toBe('pro');
  });

  it('falls back to free plan when no subscription exists', async () => {
    repo.listGrantsForIdentity.mockResolvedValue([]);
    repo.listSubscriptions.mockResolvedValue([]);
    repo.listActiveOverrides.mockResolvedValue([]);
    repo.getPlan.mockResolvedValue({ id: 'free', label: 'Free', entitlements: [], limits: {} });
    const r = await svc.resolve('u1');
    expect(r.plan?.id).toBe('free');
    expect(r.activeRole).toBe('user');
  });

  it('checkAccess returns upgrade_required when feature missing', async () => {
    repo.listGrantsForIdentity.mockResolvedValue([{ role: 'user', orgId: null }]);
    repo.listSubscriptions.mockResolvedValue([]);
    repo.listActiveOverrides.mockResolvedValue([]);
    repo.getPlan.mockResolvedValue({ id: 'free', entitlements: [], limits: {} });
    const r = await svc.checkAccess('u1', { feature: 'recruiter-pro' }, ctx);
    expect(r.outcome).toBe('upgrade_required');
    expect(repo.logAccess).toHaveBeenCalledWith('u1', null, 'recruiter-pro', null, 'upgrade_required', null, expect.any(Object));
  });

  it('checkAccess returns role_required when role missing', async () => {
    repo.listGrantsForIdentity.mockResolvedValue([{ role: 'user', orgId: null }]);
    repo.listSubscriptions.mockResolvedValue([]);
    repo.listActiveOverrides.mockResolvedValue([]);
    repo.getPlan.mockResolvedValue({ id: 'free', entitlements: [], limits: {} });
    const r = await svc.checkAccess('u1', { requiredRole: 'admin' }, ctx);
    expect(r.outcome).toBe('role_required');
  });

  it('switchRole rejects un-granted roles', async () => {
    repo.listGrantsForIdentity.mockResolvedValue([{ role: 'user', orgId: null }]);
    await expect(svc.switchRole('u1', 'admin', null, ctx)).rejects.toThrow('role_not_granted');
  });

  it('switchRole accepts granted role and logs the event', async () => {
    repo.listGrantsForIdentity.mockResolvedValue([{ role: 'professional', orgId: null }]);
    const r = await svc.switchRole('u1', 'professional', null, ctx);
    expect(r.activeRole).toBe('professional');
    expect(repo.logRoleSwitch).toHaveBeenCalled();
  });

  it('changePlan rejects unknown plan', async () => {
    repo.getPlan.mockResolvedValue(null);
    await expect(svc.changePlan({ subscriptionId: 's1', toPlan: 'mystery' }, 'u1')).rejects.toThrow('plan_not_found');
  });
});
