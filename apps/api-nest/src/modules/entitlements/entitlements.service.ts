import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EntitlementsRepository } from './entitlements.repository';
import { D3Emit } from '../domain-bus/domain-emissions';

export interface ResolvedEntitlements {
  identityId: string;
  orgId?: string | null;
  roles: string[];
  activeRole: string;
  plan: { id: string; label: string; entitlements: string[]; limits: Record<string, unknown> } | null;
  entitlements: string[];      // effective set
  overrides: { feature: string; grant: boolean; reason?: string|null }[];
  computedAt: string;
}

function envelope<T>(items: T[]) {
  return { items, total: items.length, limit: items.length, hasMore: false };
}

@Injectable()
export class EntitlementsService {
  constructor(private readonly repo: EntitlementsRepository) {}

  // ---- plans ----
  async listPlans() { return envelope(await this.repo.listPlans()); }
  upsertPlan(p: any) { return this.repo.upsertPlan(p); }

  // ---- roles ----
  async grantRole(d: { identityId: string; role: string; orgId?: string; expiresAt?: string }, actor: string|null) {
    const r = await this.repo.grantRole(d.identityId, d.role, d.orgId ?? null, actor, d.expiresAt ?? null);
    D3Emit.roleGranted(d.orgId ?? 'tenant-demo', d.identityId, { identityId: d.identityId, role: d.role, orgId: d.orgId, actorId: actor, expiresAt: d.expiresAt });
    return r;
  }
  async revokeRole(d: { identityId: string; role: string; orgId?: string }) {
    const r = await this.repo.revokeRole(d.identityId, d.role, d.orgId ?? null);
    if (!r) throw new NotFoundException('role_grant_not_found');
    D3Emit.roleRevoked(d.orgId ?? 'tenant-demo', d.identityId, { identityId: d.identityId, role: d.role, orgId: d.orgId });
    return r;
  }
  async switchRole(identityId: string, to: string, orgId: string|null, ctx: { ip: string|null; userAgent: string|null }) {
    const grants = await this.repo.listGrantsForIdentity(identityId);
    const allowed = grants.some((g: any) => g.role === to && (!orgId || g.orgId === orgId || g.orgId === null));
    if (!allowed) throw new ForbiddenException('role_not_granted');
    await this.repo.logRoleSwitch(identityId, null, to, orgId, ctx.ip, ctx.userAgent);
    D3Emit.roleSwitched(orgId ?? 'tenant-demo', identityId, { identityId, activeRole: to, orgId });
    return { ok: true, activeRole: to, orgId };
  }

  // ---- subscriptions / plan changes ----
  async listSubscriptions(filter: { identityId?: string; orgId?: string }) { return envelope(await this.repo.listSubscriptions(filter)); }
  async createSubscription(d: any) {
    if (!d.identityId && !d.orgId) throw new BadRequestException('identity_or_org_required');
    const plan = await this.repo.getPlan(d.planId);
    if (!plan) throw new NotFoundException('plan_not_found');
    const sub = await this.repo.createSubscription({
      identityId: d.identityId ?? null, orgId: d.orgId ?? null, planId: d.planId,
      billingCycle: d.billingCycle ?? 'monthly', seats: d.seats ?? 1,
    });
    D3Emit.subscriptionCreated(d.orgId ?? 'tenant-demo', sub?.id ?? d.identityId ?? d.orgId, {
      subscriptionId: sub?.id, identityId: d.identityId, orgId: d.orgId, planId: d.planId,
      billingCycle: d.billingCycle ?? 'monthly', seats: d.seats ?? 1,
    });
    return sub;
  }
  async changePlan(d: { subscriptionId: string; toPlan: string; reason?: string }, actor: string|null) {
    const plan = await this.repo.getPlan(d.toPlan);
    if (!plan) throw new NotFoundException('plan_not_found');
    const r = await this.repo.changeSubscriptionPlan(d.subscriptionId, d.toPlan, actor, d.reason ?? null);
    if (!r) throw new NotFoundException('subscription_not_found');
    D3Emit.subscriptionChanged('tenant-demo', d.subscriptionId, { subscriptionId: d.subscriptionId, toPlan: d.toPlan, reason: d.reason, actorId: actor });
    return r;
  }
  async cancelSubscription(d: { subscriptionId: string; immediate?: boolean }) {
    const r = await this.repo.cancelSubscription(d.subscriptionId, !!d.immediate);
    if (!r) throw new NotFoundException('subscription_not_found');
    D3Emit.subscriptionCancelled('tenant-demo', d.subscriptionId, { subscriptionId: d.subscriptionId, immediate: !!d.immediate });
    return r;
  }

  // ---- overrides ----
  async createOverride(d: any, actor: string|null) {
    if (!d.identityId && !d.orgId) throw new BadRequestException('identity_or_org_required');
    const o: any = await this.repo.createOverride(d, actor);
    D3Emit.overrideCreated(d.orgId ?? 'tenant-demo', o?.id ?? d.feature, { ...d, overrideId: o?.id, actorId: actor });
    return o;
  }
  async revokeOverride(id: string) {
    const r = await this.repo.revokeOverride(id);
    D3Emit.overrideRevoked('tenant-demo', id, { overrideId: id });
    return r;
  }

  // ---- core resolution ----
  async resolve(identityId: string, orgId: string | null = null): Promise<ResolvedEntitlements> {
    const [grants, subs, overrides] = await Promise.all([
      this.repo.listGrantsForIdentity(identityId),
      this.repo.listSubscriptions({ identityId }),
      this.repo.listActiveOverrides({ identityId, orgId: orgId ?? undefined }),
    ]);
    let orgSubs: any[] = [];
    if (orgId) orgSubs = await this.repo.listSubscriptions({ orgId });

    const sub = (orgSubs[0] ?? subs[0]) ?? null;
    const plan = sub ? await this.repo.getPlan(sub.plan_id) : await this.repo.getPlan('free');
    const baseSet = new Set<string>(plan?.entitlements ?? []);
    for (const o of overrides) {
      if (o.grant) baseSet.add(o.feature);
      else baseSet.delete(o.feature);
    }
    const roles = Array.from(new Set(grants.map((g: any) => g.role)));
    if (roles.length === 0) roles.push('user');
    const activeRole = roles.includes('professional') ? 'professional' : roles[0];

    return {
      identityId, orgId,
      roles, activeRole,
      plan: plan ? { id: plan.id, label: plan.label, entitlements: plan.entitlements ?? [], limits: plan.limits ?? {} } : null,
      entitlements: Array.from(baseSet),
      overrides: overrides.map((o: any) => ({ feature: o.feature, grant: o.grant, reason: o.reason })),
      computedAt: new Date().toISOString(),
    };
  }

  async checkAccess(identityId: string, d: { feature?: string; requiredRole?: string; orgId?: string; route?: string }, ctx: { ip: string|null; userAgent: string|null }) {
    const resolved = await this.resolve(identityId, d.orgId ?? null);
    let outcome: 'allowed'|'denied'|'upgrade_required'|'role_required' = 'allowed';
    if (d.requiredRole && !resolved.roles.includes(d.requiredRole)) outcome = 'role_required';
    if (d.feature && !resolved.entitlements.includes(d.feature)) outcome = outcome === 'role_required' ? 'role_required' : 'upgrade_required';
    await this.repo.logAccess(identityId, d.orgId ?? null, d.feature ?? null, d.requiredRole ?? null, outcome, d.route ?? null, { ua: ctx.userAgent });
    if (outcome !== 'allowed') {
      D3Emit.accessDenied(d.orgId ?? 'tenant-demo', identityId, { identityId, feature: d.feature, requiredRole: d.requiredRole, outcome, route: d.route });
    }
    return { outcome, resolved };
  }

  recentDenials(identityId: string, days = 30) { return this.repo.recentDenials(identityId, days); }
}
