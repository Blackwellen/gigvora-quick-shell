import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class EntitlementsRepository {
  constructor(private readonly ds: DataSource) {}

  // ---- plans ----
  listPlans() {
    return this.ds.query(
      `SELECT id, label, description, price_monthly AS "priceMonthly", price_annual AS "priceAnnual",
              entitlements, limits, highlight, badge, position, active,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM plans WHERE active = true ORDER BY position ASC, id ASC`,
    );
  }
  getPlan(id: string) {
    return this.ds.query<any[]>(
      `SELECT id, label, description, price_monthly AS "priceMonthly", price_annual AS "priceAnnual",
              entitlements, limits, highlight, badge, position, active
       FROM plans WHERE id = $1`, [id],
    ).then(r => r[0] ?? null);
  }
  async upsertPlan(p: any) {
    const r = await this.ds.query(
      `INSERT INTO plans (id, label, description, price_monthly, price_annual, entitlements, limits, highlight, badge, position, active)
       VALUES ($1,$2,COALESCE($3,''),COALESCE($4,0),COALESCE($5,0),COALESCE($6,'{}')::text[],COALESCE($7,'{}'::jsonb),COALESCE($8,false),$9,COALESCE($10,0),COALESCE($11,true))
       ON CONFLICT (id) DO UPDATE SET label=EXCLUDED.label, description=EXCLUDED.description,
         price_monthly=EXCLUDED.price_monthly, price_annual=EXCLUDED.price_annual,
         entitlements=EXCLUDED.entitlements, limits=EXCLUDED.limits, highlight=EXCLUDED.highlight,
         badge=EXCLUDED.badge, position=EXCLUDED.position, active=EXCLUDED.active, updated_at=now()
       RETURNING *`,
      [p.id, p.label, p.description, p.priceMonthly, p.priceAnnual, p.entitlements, p.limits, p.highlight, p.badge, p.position, p.active],
    );
    return r[0];
  }

  // ---- role grants ----
  listGrantsForIdentity(identityId: string) {
    return this.ds.query(
      `SELECT id, identity_id AS "identityId", org_id AS "orgId", role, status,
              granted_by AS "grantedBy", granted_at AS "grantedAt", expires_at AS "expiresAt", meta
       FROM role_grants
       WHERE identity_id=$1 AND status='active'
         AND (expires_at IS NULL OR expires_at > now())
       ORDER BY granted_at DESC`, [identityId],
    );
  }
  async grantRole(identityId: string, role: string, orgId: string | null, grantedBy: string | null, expiresAt: string | null, meta: any = {}) {
    const r = await this.ds.query(
      `INSERT INTO role_grants (identity_id, org_id, role, status, granted_by, expires_at, meta)
       VALUES ($1,$2,$3,'active',$4,$5,$6::jsonb)
       ON CONFLICT (identity_id, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::uuid), role)
         DO UPDATE SET status='active', revoked_at=NULL, expires_at=EXCLUDED.expires_at, granted_by=EXCLUDED.granted_by, granted_at=now(), meta=role_grants.meta || EXCLUDED.meta
       RETURNING *`,
      [identityId, orgId, role, grantedBy, expiresAt, JSON.stringify(meta)],
    );
    return r[0];
  }
  async revokeRole(identityId: string, role: string, orgId: string | null) {
    const r = await this.ds.query(
      `UPDATE role_grants SET status='revoked', revoked_at=now()
       WHERE identity_id=$1 AND role=$2 AND COALESCE(org_id,'00000000-0000-0000-0000-000000000000'::uuid)=COALESCE($3,'00000000-0000-0000-0000-000000000000'::uuid)
       RETURNING *`, [identityId, role, orgId],
    );
    return r[0] ?? null;
  }

  // ---- subscriptions ----
  listSubscriptions(filter: { identityId?: string; orgId?: string }) {
    if (filter.identityId) {
      return this.ds.query(
        `SELECT * FROM subscriptions WHERE identity_id=$1 AND status NOT IN ('canceled','expired') ORDER BY created_at DESC`,
        [filter.identityId],
      );
    }
    if (filter.orgId) {
      return this.ds.query(
        `SELECT * FROM subscriptions WHERE org_id=$1 AND status NOT IN ('canceled','expired') ORDER BY created_at DESC`,
        [filter.orgId],
      );
    }
    return Promise.resolve([]);
  }
  getSubscription(id: string) {
    return this.ds.query<any[]>(`SELECT * FROM subscriptions WHERE id=$1`, [id]).then(r => r[0] ?? null);
  }
  async createSubscription(s: { identityId?: string|null; orgId?: string|null; planId: string; billingCycle: 'monthly'|'annual'; seats: number; }) {
    const r = await this.ds.query(
      `INSERT INTO subscriptions (identity_id, org_id, plan_id, status, billing_cycle, seats,
                                  current_period_start, current_period_end)
       VALUES ($1,$2,$3,'active',$4,$5, now(), now() + ($6 || ' days')::interval)
       RETURNING *`,
      [s.identityId ?? null, s.orgId ?? null, s.planId, s.billingCycle, s.seats, s.billingCycle === 'annual' ? 365 : 30],
    );
    return r[0];
  }
  async changeSubscriptionPlan(id: string, toPlan: string, requestedBy: string | null, reason: string | null) {
    const sub = await this.getSubscription(id);
    if (!sub) return null;
    await this.ds.query(
      `INSERT INTO plan_changes (subscription_id, from_plan, to_plan, status, requested_by, reason, applied_at)
       VALUES ($1,$2,$3,'applied',$4,$5, now())`,
      [id, sub.plan_id, toPlan, requestedBy, reason],
    );
    const r = await this.ds.query(
      `UPDATE subscriptions SET plan_id=$2, updated_at=now() WHERE id=$1 RETURNING *`, [id, toPlan],
    );
    return r[0];
  }
  async cancelSubscription(id: string, immediate: boolean) {
    const r = await this.ds.query(
      `UPDATE subscriptions SET
         status = CASE WHEN $2 THEN 'canceled' ELSE status END,
         cancel_at = CASE WHEN $2 THEN now() ELSE current_period_end END,
         canceled_at = CASE WHEN $2 THEN now() ELSE canceled_at END,
         updated_at = now()
       WHERE id=$1 RETURNING *`, [id, immediate],
    );
    return r[0] ?? null;
  }

  // ---- entitlement overrides ----
  listActiveOverrides(filter: { identityId?: string; orgId?: string }) {
    return this.ds.query(
      `SELECT * FROM entitlement_overrides
       WHERE status='active' AND (expires_at IS NULL OR expires_at > now())
         AND ((identity_id = $1) OR (org_id = $2))`,
      [filter.identityId ?? null, filter.orgId ?? null],
    );
  }
  async createOverride(o: any, grantedBy: string | null) {
    const r = await this.ds.query(
      `INSERT INTO entitlement_overrides (identity_id, org_id, feature, grant, reason, granted_by, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [o.identityId ?? null, o.orgId ?? null, o.feature, !!o.grant, o.reason ?? null, grantedBy, o.expiresAt ?? null],
    );
    return r[0];
  }
  async revokeOverride(id: string) {
    const r = await this.ds.query(
      `UPDATE entitlement_overrides SET status='revoked' WHERE id=$1 RETURNING *`, [id],
    );
    return r[0] ?? null;
  }

  // ---- access attempts ----
  async logAccess(identityId: string|null, orgId: string|null, feature: string|null, requiredRole: string|null, outcome: string, route: string|null, meta: any = {}) {
    await this.ds.query(
      `INSERT INTO access_attempts (identity_id, org_id, feature, required_role, outcome, route, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [identityId, orgId, feature, requiredRole, outcome, route, JSON.stringify(meta)],
    );
  }
  recentDenials(identityId: string, days = 30) {
    return this.ds.query(
      `SELECT feature, count(*)::int AS c
       FROM access_attempts
       WHERE identity_id=$1 AND outcome IN ('denied','upgrade_required','role_required')
         AND created_at > now() - ($2 || ' days')::interval
       GROUP BY feature ORDER BY c DESC LIMIT 20`,
      [identityId, days],
    );
  }

  // ---- role switching ----
  async logRoleSwitch(identityId: string, from: string|null, to: string, orgId: string|null, ip: string|null, ua: string|null) {
    await this.ds.query(
      `INSERT INTO role_switch_events (identity_id, from_role, to_role, org_id, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [identityId, from, to, orgId, ip, ua],
    );
  }
}
