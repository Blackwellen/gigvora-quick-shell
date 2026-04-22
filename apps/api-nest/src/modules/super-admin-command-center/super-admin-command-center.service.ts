import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SuperAdminCommandCenterRepository } from './super-admin-command-center.repository';
import { FLAG_TRANSITIONS, INCIDENT_TRANSITIONS } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

type Meta = { ip?: string; userAgent?: string };

/**
 * Domain 74 — Super Admin Command Center.
 * Role ladder: viewer < sa_operator < sa_admin < sa_root.
 *  - viewer:      read everything (flags, overrides, incidents, audit).
 *  - sa_operator: create/edit flags + overrides, open incidents, transition non-destructive.
 *  - sa_admin:    toggle/rollout/archive flags, archive overrides, resolve incidents, kill_switch.
 *  - sa_root:     destructive overrides + cost_cap edits.
 */
@Injectable()
export class SuperAdminCommandCenterService {
  private readonly logger = new Logger(SuperAdminCommandCenterService.name);
  constructor(private readonly repo: SuperAdminCommandCenterRepository) {}

  async overview(role: string) {
    this.assertRead(role);
    const [kpis, flagsActive, overridesActive, incidents] = await Promise.all([
      this.repo.kpis(),
      this.repo.listFlags({ status: 'active', page: 1, pageSize: 10 }),
      this.repo.listOverrides({ status: 'active', page: 1, pageSize: 10 }),
      this.repo.listIncidents({ status: 'open' }),
    ]);
    const audit = await this.repo.listAudit({ page: 1, pageSize: 25 });
    const insights = await this.fetchInsights(kpis).catch(() => this.fallbackInsights(kpis));
    return {
      kpis,
      flagsActive: flagsActive.items,
      overridesActive: overridesActive.items,
      openIncidents: incidents,
      recentAudit: audit.items,
      insights,
      computedAt: new Date().toISOString(),
    };
  }

  // ── Feature flags ────────────────────────────────────
  async listFlags(role: string, filter: any) {
    this.assertRead(role);
    const r = await this.repo.listFlags(filter);
    return { items: r.items, total: r.total, meta: { source: 'super_admin', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 } };
  }
  async flagById(role: string, id: string) {
    this.assertRead(role);
    const r = await this.repo.flagById(id);
    if (!r) throw new NotFoundException({ code: 'flag_not_found' });
    return r;
  }
  async createFlag(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertOperator(role);
    const f = await this.repo.createFlag(dto, actorId);
    await this.repo.logAudit({ actorId, domain: 'feature_flag', targetId: f.id, action: 'create', toState: 'draft',
      diff: { key: f.key, rolloutPct: f.rollout_pct }, ip: meta.ip, userAgent: meta.userAgent });
    return f;
  }
  async updateFlag(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertOperator(role);
    const before = await this.repo.flagById(dto.id);
    if (!before) throw new NotFoundException({ code: 'flag_not_found' });
    const after = await this.repo.updateFlag(dto.id, dto);
    await this.repo.logAudit({ actorId, domain: 'feature_flag', targetId: dto.id, action: 'update',
      diff: { keys: Object.keys(dto).filter((k) => k !== 'id') }, ip: meta.ip, userAgent: meta.userAgent });
    return after;
  }
  async toggleFlag(actorId: string, role: string, dto: { id: string; enabled: boolean }, meta: Meta) {
    this.assertAdmin(role);
    const before = await this.repo.flagById(dto.id);
    if (!before) throw new NotFoundException({ code: 'flag_not_found' });
    const after = await this.repo.setFlagEnabled(dto.id, dto.enabled);
    await this.repo.logAudit({ actorId, domain: 'feature_flag', targetId: dto.id, action: 'toggle',
      fromState: String(before.enabled), toState: String(dto.enabled), ip: meta.ip, userAgent: meta.userAgent });
    return after;
  }
  async rolloutFlag(actorId: string, role: string, dto: { id: string; rolloutPct: number }, meta: Meta) {
    this.assertAdmin(role);
    const before = await this.repo.flagById(dto.id);
    if (!before) throw new NotFoundException({ code: 'flag_not_found' });
    const after = await this.repo.setFlagRollout(dto.id, dto.rolloutPct);
    await this.repo.logAudit({ actorId, domain: 'feature_flag', targetId: dto.id, action: 'rollout',
      fromState: String(before.rollout_pct), toState: String(dto.rolloutPct), ip: meta.ip, userAgent: meta.userAgent });
    return after;
  }
  async setFlagStatus(actorId: string, role: string, dto: { id: string; status: string }, meta: Meta) {
    this.assertAdmin(role);
    const before = await this.repo.flagById(dto.id);
    if (!before) throw new NotFoundException({ code: 'flag_not_found' });
    const allowed = FLAG_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(dto.status)) throw new BadRequestException({ code: 'bad_transition', from: before.status, to: dto.status });
    const after = await this.repo.setFlagStatus(dto.id, dto.status);
    await this.repo.logAudit({ actorId, domain: 'feature_flag', targetId: dto.id, action: 'status',
      fromState: before.status, toState: dto.status, ip: meta.ip, userAgent: meta.userAgent });
    return after;
  }

  // ── Overrides ────────────────────────────────────────
  async listOverrides(role: string, filter: any) {
    this.assertRead(role);
    const r = await this.repo.listOverrides(filter);
    return { items: r.items, total: r.total, meta: { source: 'super_admin', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 } };
  }
  async createOverride(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertOperator(role);
    if ((dto.kind === 'kill_switch' || dto.kind === 'cost_cap') && !this.isAdmin(role)) {
      throw new ForbiddenException({ code: 'sa_admin_required_for_destructive' });
    }
    const o = await this.repo.createOverride(dto, actorId);
    await this.repo.logAudit({ actorId, domain: 'override', targetId: o.id, action: 'create', toState: 'active',
      diff: { scope: o.scope, scopeId: o.scope_id, kind: o.kind, reason: dto.reason }, ip: meta.ip, userAgent: meta.userAgent });
    return o;
  }
  async updateOverride(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertOperator(role);
    const before = await this.repo.overrideById(dto.id);
    if (!before) throw new NotFoundException({ code: 'override_not_found' });
    if ((before.kind === 'kill_switch' || before.kind === 'cost_cap') && !this.isAdmin(role)) {
      throw new ForbiddenException({ code: 'sa_admin_required_for_destructive' });
    }
    const after = await this.repo.updateOverride(dto.id, dto);
    await this.repo.logAudit({ actorId, domain: 'override', targetId: dto.id, action: 'update',
      fromState: before.status, toState: after.status,
      diff: { keys: Object.keys(dto).filter((k) => k !== 'id') }, ip: meta.ip, userAgent: meta.userAgent });
    return after;
  }

  // ── Incidents ────────────────────────────────────────
  async listIncidents(role: string, status?: string) {
    this.assertRead(role); return this.repo.listIncidents({ status });
  }
  async createIncident(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertOperator(role);
    const inc = await this.repo.createIncident(dto, actorId);
    await this.repo.logAudit({ actorId, domain: 'incident', targetId: inc.id, action: 'create', toState: 'open',
      diff: { severity: inc.severity, scope: inc.scope }, ip: meta.ip, userAgent: meta.userAgent });
    return inc;
  }
  async transitionIncident(actorId: string, role: string, dto: any, meta: Meta) {
    this.assertOperator(role);
    const before = await this.repo.incidentById(dto.id);
    if (!before) throw new NotFoundException({ code: 'incident_not_found' });
    const allowed = INCIDENT_TRANSITIONS[before.status] ?? [];
    if (!allowed.includes(dto.to)) throw new BadRequestException({ code: 'bad_transition', from: before.status, to: dto.to });
    if ((dto.to === 'resolved' || dto.to === 'archived') && !this.isAdmin(role)) {
      throw new ForbiddenException({ code: 'sa_admin_required_for_close' });
    }
    const after = await this.repo.transitionIncident(dto.id, dto.to, dto.notes);
    await this.repo.logAudit({ actorId, domain: 'incident', targetId: dto.id, action: 'transition',
      fromState: before.status, toState: dto.to, ip: meta.ip, userAgent: meta.userAgent });
    return after;
  }

  // ── Audit ────────────────────────────────────────────
  async listAudit(role: string, filter: any) { this.assertRead(role); return this.repo.listAudit(filter); }

  // ── Insights ────────────────────────────────────────
  private async fetchInsights(kpis: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/super-admin-command-center/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals: kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics sa insights down: ${(e as Error).message}`); }
    return this.fallbackInsights(kpis);
  }
  private fallbackInsights(k: any) {
    const out: any[] = [];
    const sev1 = k.openIncidentsBySev?.sev1 ?? 0;
    const sev2 = k.openIncidentsBySev?.sev2 ?? 0;
    const kills = k.killSwitchesActive ?? 0;
    const audit = k.auditEvents24h ?? 0;
    const draftFlags = k.flagsByStatus?.draft ?? 0;
    if (sev1)         out.push({ id: 'sev1_open',     severity: 'critical', title: `${sev1} sev1 incident(s) open — page on-call.` });
    if (sev2)         out.push({ id: 'sev2_open',     severity: 'warn',     title: `${sev2} sev2 incident(s) open.` });
    if (kills)        out.push({ id: 'kill_switches', severity: 'critical', title: `${kills} kill-switch override(s) active.` });
    if (audit > 200)  out.push({ id: 'audit_volume',  severity: 'info',     title: `${audit} admin events in 24h — review for anomalies.` });
    if (draftFlags > 5) out.push({ id: 'draft_flags', severity: 'info',     title: `${draftFlags} feature flag(s) in draft.` });
    if (!out.length)  out.push({ id: 'platform_healthy', severity: 'success', title: 'Platform posture healthy.' });
    return out;
  }

  // ── Helpers ─────────────────────────────────────────
  private isReader(r: string)   { return ['viewer','sa_operator','sa_admin','sa_root'].includes(r); }
  private isOperator(r: string) { return ['sa_operator','sa_admin','sa_root'].includes(r); }
  private isAdmin(r: string)    { return ['sa_admin','sa_root'].includes(r); }
  private assertRead(r: string)     { if (!this.isReader(r))   throw new ForbiddenException({ code: 'sa_read_required' }); }
  private assertOperator(r: string) { if (!this.isOperator(r)) throw new ForbiddenException({ code: 'sa_operator_required' }); }
  private assertAdmin(r: string)    { if (!this.isAdmin(r))    throw new ForbiddenException({ code: 'sa_admin_required' }); }
}
