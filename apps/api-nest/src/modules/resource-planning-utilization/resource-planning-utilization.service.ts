import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ResourcePlanningUtilizationRepository } from './resource-planning-utilization.repository';
import {
  ASSIGNMENT_TRANSITIONS, PROJECT_TRANSITIONS, AssignmentStatus, ProjectStatus,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

@Injectable()
export class ResourcePlanningUtilizationService {
  private readonly logger = new Logger(ResourcePlanningUtilizationService.name);
  constructor(private readonly repo: ResourcePlanningUtilizationRepository) {}

  // ─── Overview ───────────────────────────────────────────
  async overview(orgId: string) {
    const today = new Date();
    const from = today.toISOString().slice(0, 10);
    const to = new Date(today.getTime() + 28 * 86400_000).toISOString().slice(0, 10);

    const [resources, projects, assignments, util] = await Promise.all([
      this.repo.listResources(orgId, { status: 'active', page: 1, pageSize: 200 }),
      this.repo.listProjects(orgId, { status: 'active', page: 1, pageSize: 200 }),
      this.repo.listAssignments(orgId, { page: 1, pageSize: 200, from, to }),
      this.repo.utilization(orgId, from, to),
    ]);

    const overbooked = util.filter((u) => Number(u.utilization_ratio) > 1).length;
    const underbooked = util.filter((u) => Number(u.utilization_ratio) < 0.6).length;
    const avgUtil = util.length ? util.reduce((s, u) => s + Number(u.utilization_ratio), 0) / util.length : 0;

    const insights = await this.fetchInsights(orgId, {
      activeResources: resources.total, activeProjects: projects.total,
      assignmentsInWindow: assignments.total, overbooked, underbooked, avgUtilization: avgUtil,
    }).catch(() => this.fallbackInsights({ overbooked, underbooked, avgUtil }));

    return {
      kpis: {
        activeResources: resources.total, activeProjects: projects.total,
        assignmentsInWindow: assignments.total,
        avgUtilizationPct: Math.round(avgUtil * 1000) / 10,
        overbookedResources: overbooked, underbookedResources: underbooked,
      },
      window: { from, to },
      utilization: util,
      insights,
      computedAt: new Date().toISOString(),
    };
  }

  private async fetchInsights(orgId: string, signals: any) {
    try {
      const res = await fetch(`${ANALYTICS_BASE}/resource-planning-utilization/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, signals }), signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return (await res.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals);
  }
  private fallbackInsights(s: { overbooked?: number; underbooked?: number; avgUtil?: number }) {
    const out: any[] = [];
    if ((s.overbooked ?? 0) > 0) out.push({ id: 'overbooked', severity: 'error', title: `${s.overbooked} resource(s) overbooked`, body: 'Reassign or extend timelines to relieve.' });
    if ((s.underbooked ?? 0) > 0) out.push({ id: 'underbooked', severity: 'warn', title: `${s.underbooked} resource(s) underutilized`, body: 'Consider shifting them to active projects.' });
    if (!out.length) out.push({ id: 'healthy', severity: 'success', title: 'Capacity healthy', body: 'Utilization is balanced across the team.' });
    return out;
  }

  // ─── ML: assignment recommendation ──────────────────────
  async recommendAssignment(orgId: string, projectId: string, role?: string) {
    const project = await this.repo.getProject(orgId, projectId);
    if (!project) throw new NotFoundException('project not found');
    const today = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 28 * 86400_000).toISOString().slice(0, 10);
    const [resources, util] = await Promise.all([
      this.repo.listResources(orgId, { status: 'active', page: 1, pageSize: 200 }),
      this.repo.utilization(orgId, today, to),
    ]);
    try {
      const res = await fetch(`${ML_BASE}/resource-planning-utilization/recommend`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ project: { id: project.id, name: project.name, role }, resources: resources.items, utilization: util }),
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) return await res.json();
    } catch (e) { this.logger.warn(`ml down: ${(e as Error).message}`); }
    // deterministic fallback: rank by lowest utilization & matching role
    const utilByResource = new Map(util.map((u) => [u.resource_id, Number(u.utilization_ratio)]));
    const ranked = resources.items
      .map((r: any) => ({
        resourceId: r.id, fullName: r.full_name, role: r.role,
        utilization: utilByResource.get(r.id) ?? 0,
        score: (role && r.role === role ? 0.4 : 0) + Math.max(0, 1 - (utilByResource.get(r.id) ?? 0)),
      }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);
    return { source: 'fallback', candidates: ranked };
  }

  // ─── Resources ─────────────────────────────────────────
  listResources(orgId: string, q: any) { return this.repo.listResources(orgId, q); }
  async getResource(orgId: string, id: string) {
    const r = await this.repo.getResource(orgId, id);
    if (!r) throw new NotFoundException('resource not found');
    return r;
  }
  async createResource(orgId: string, dto: any, actorId: string, req?: any) {
    const row = await this.repo.createResource({ orgIdentityId: orgId, ...dto, status: 'active' });
    await this.repo.recordAudit(orgId, actorId, 'resource.created', { type: 'resource', id: row.id }, { name: dto.fullName }, req);
    return row;
  }
  async updateResource(orgId: string, id: string, patch: any, actorId: string, req?: any) {
    const before = await this.getResource(orgId, id);
    const row = await this.repo.updateResource(id, patch);
    await this.repo.recordAudit(orgId, actorId, 'resource.updated', { type: 'resource', id }, { before, after: row }, req);
    return row;
  }

  // ─── Projects ──────────────────────────────────────────
  listProjects(orgId: string, q: any) { return this.repo.listProjects(orgId, q); }
  async getProject(orgId: string, id: string) {
    const r = await this.repo.getProject(orgId, id);
    if (!r) throw new NotFoundException('project not found');
    return r;
  }
  async createProject(orgId: string, dto: any, actorId: string, req?: any) {
    const existing = await this.repo.getProjectByCode(orgId, dto.code);
    if (existing) throw new ConflictException(`code already in use: ${dto.code}`);
    const row = await this.repo.createProject({ orgIdentityId: orgId, ...dto, status: 'active' });
    await this.repo.recordAudit(orgId, actorId, 'project.created', { type: 'project', id: row.id }, { name: dto.name, code: dto.code }, req);
    return row;
  }
  async updateProject(orgId: string, id: string, patch: any, actorId: string, req?: any) {
    const before = await this.getProject(orgId, id);
    const row = await this.repo.updateProject(id, patch);
    await this.repo.recordAudit(orgId, actorId, 'project.updated', { type: 'project', id }, { before, after: row }, req);
    return row;
  }
  async transitionProject(orgId: string, id: string, status: ProjectStatus, actorId: string, req?: any) {
    const project = await this.getProject(orgId, id);
    const allowed = PROJECT_TRANSITIONS[project.status as ProjectStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${project.status} → ${status}`);
    const row = await this.repo.setProjectStatus(id, status);
    await this.repo.recordAudit(orgId, actorId, `project.${status}`, { type: 'project', id }, { from: project.status, to: status }, req);
    return row;
  }

  // ─── Assignments ───────────────────────────────────────
  listAssignments(orgId: string, q: any) { return this.repo.listAssignments(orgId, q); }
  async getAssignment(orgId: string, id: string) {
    const r = await this.repo.getAssignment(orgId, id);
    if (!r) throw new NotFoundException('assignment not found');
    return r;
  }
  async createAssignment(orgId: string, dto: any, actorId: string, req?: any) {
    // Validate references and detect overbooking
    const [resource, project] = await Promise.all([
      this.repo.getResource(orgId, dto.resourceId),
      this.repo.getProject(orgId, dto.projectId),
    ]);
    if (!resource) throw new BadRequestException('resourceId not found in this org');
    if (!project) throw new BadRequestException('projectId not found in this org');
    if (resource.status !== 'active') throw new BadRequestException('resource is inactive');
    if (project.status !== 'active' && project.status !== 'paused') {
      throw new BadRequestException(`cannot assign to project with status ${project.status}`);
    }
    // Soft overbooking warning is a header, not a hard block — record in audit diff.
    const row = await this.repo.createAssignment({
      orgIdentityId: orgId, ...dto, createdBy: actorId,
    });
    await this.repo.recordAudit(orgId, actorId, 'assignment.created',
      { type: 'assignment', id: row.id },
      { resourceId: dto.resourceId, projectId: dto.projectId, hoursPerWeek: dto.hoursPerWeek }, req);
    return row;
  }
  async updateAssignment(orgId: string, id: string, patch: any, actorId: string, req?: any) {
    const before = await this.getAssignment(orgId, id);
    if (['completed', 'cancelled'].includes(before.status)) {
      throw new BadRequestException(`cannot edit assignment in terminal status ${before.status}`);
    }
    const row = await this.repo.updateAssignment(id, patch);
    await this.repo.recordAudit(orgId, actorId, 'assignment.updated', { type: 'assignment', id }, { before, after: row }, req);
    return row;
  }
  async transitionAssignment(orgId: string, id: string, status: AssignmentStatus, reason: string | undefined, actorId: string, req?: any) {
    const a = await this.getAssignment(orgId, id);
    const allowed = ASSIGNMENT_TRANSITIONS[a.status as AssignmentStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${a.status} → ${status}`);
    const extra: any = {};
    if (status === 'cancelled') extra.cancelledReason = reason ?? null;
    const row = await this.repo.setAssignmentStatus(id, status, extra);
    await this.repo.recordAudit(orgId, actorId, `assignment.${status}`, { type: 'assignment', id }, { from: a.status, to: status, reason }, req);
    return row;
  }

  // ─── Time-off ──────────────────────────────────────────
  async listTimeOff(orgId: string, resourceId?: string, from?: string, to?: string) {
    return this.repo.listTimeOff(orgId, resourceId, from, to);
  }
  async createTimeOff(orgId: string, dto: any, actorId: string, req?: any) {
    const resource = await this.repo.getResource(orgId, dto.resourceId);
    if (!resource) throw new BadRequestException('resource not found in this org');
    const row = await this.repo.createTimeOff({ orgIdentityId: orgId, ...dto });
    await this.repo.recordAudit(orgId, actorId, 'timeoff.created', { type: 'timeoff', id: row.id }, dto, req);
    return row;
  }
  async deleteTimeOff(orgId: string, id: string, actorId: string, req?: any) {
    await this.repo.deleteTimeOff(orgId, id);
    await this.repo.recordAudit(orgId, actorId, 'timeoff.deleted', { type: 'timeoff', id }, {}, req);
    return { ok: true };
  }

  // ─── Utilization ───────────────────────────────────────
  utilization(orgId: string, from: string, to: string, resourceId?: string, team?: string) {
    return this.repo.utilization(orgId, from, to, resourceId, team);
  }

  // ─── Audit ─────────────────────────────────────────────
  audit(orgId: string, limit = 100) { return this.repo.listAudit(orgId, limit); }
}
