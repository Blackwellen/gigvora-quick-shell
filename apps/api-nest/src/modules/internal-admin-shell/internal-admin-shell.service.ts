import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InternalAdminShellRepository } from './internal-admin-shell.repository';
import { ITEM_STATE_TRANSITIONS } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

type ReqMeta = { ip?: string; userAgent?: string };

/**
 * Internal Admin Shell domain service.
 * - Workspace routing (which routes a role can see).
 * - Queue lifecycle + state machine.
 * - Deterministic queue-jump claim with row-level locking.
 * - Global shortcut catalogue scoped by role.
 * - Append-only audit on every write.
 */
@Injectable()
export class InternalAdminShellService {
  private readonly logger = new Logger(InternalAdminShellService.name);
  constructor(private readonly repo: InternalAdminShellRepository) {}

  // ── Overview / KPIs ────────────────────────────────
  async overview(role: string) {
    const [workspaces, queues, audit] = await Promise.all([
      this.repo.listWorkspaces(),
      this.repo.listQueues(),
      this.repo.recentAudit(20),
    ]);
    const visibleWorkspaces = workspaces.filter((w: any) => this.roleSatisfies(role, w.required_role));
    const totalDepth = queues.reduce((acc: number, q: any) => acc + (q.depth ?? 0), 0);
    const healthBreakdown = queues.reduce((acc: Record<string, number>, q: any) => {
      acc[q.health] = (acc[q.health] ?? 0) + 1; return acc;
    }, { healthy: 0, caution: 0, degraded: 0, blocked: 0 });
    const insights = await this.fetchInsights({
      workspaces: workspaces.length, visibleWorkspaces: visibleWorkspaces.length,
      queues: queues.length, totalDepth, healthBreakdown,
    }).catch(() => this.fallbackInsights({ totalDepth, healthBreakdown }));

    return {
      kpis: {
        workspaces: workspaces.length,
        visibleWorkspaces: visibleWorkspaces.length,
        queues: queues.length,
        totalDepth,
        healthBreakdown,
      },
      workspaces: visibleWorkspaces,
      queues,
      recentAudit: audit,
      insights,
      computedAt: new Date().toISOString(),
    };
  }

  // ── Workspace routing ──────────────────────────────
  async listWorkspaces(role: string) {
    const rows = await this.repo.listWorkspaces();
    return {
      items: rows.filter((w: any) => this.roleSatisfies(role, w.required_role)),
      meta: { source: 'internal-admin-shell', model: 'workspace-routing-v1', role },
    };
  }
  async createWorkspace(actorId: string, role: string, dto: any, meta: ReqMeta) {
    if (role !== 'super_admin') throw new ForbiddenException({ code: 'super_admin_required' });
    if (await this.repo.getWorkspaceBySlug(dto.slug)) throw new BadRequestException({ code: 'slug_taken' });
    const r = await this.repo.createWorkspace(dto);
    await this.repo.audit({ operatorId: actorId, action: 'workspace.create', workspaceSlug: r.slug, targetType: 'workspace', targetId: r.id, diff: dto, ip: meta.ip, userAgent: meta.userAgent });
    return r;
  }

  // ── Queues ─────────────────────────────────────────
  async listQueues(role: string, opts: { workspaceSlug?: string; domain?: string }) {
    const rows = await this.repo.listQueues(opts);
    // Hide queues whose parent workspace requires a higher role.
    const workspaces = await this.repo.listWorkspaces();
    const allowedSlugs = new Set(
      workspaces.filter((w: any) => this.roleSatisfies(role, w.required_role)).map((w: any) => w.slug),
    );
    const visible = rows.filter((q: any) => !q.workspace_slug || allowedSlugs.has(q.workspace_slug));
    return { items: visible, meta: { source: 'internal-admin-shell', model: 'queues-v1', role, count: visible.length } };
  }

  async listQueueItems(role: string, queueSlug: string) {
    const queue = await this.repo.getQueueBySlug(queueSlug);
    if (!queue) throw new NotFoundException({ code: 'queue_not_found' });
    await this.assertQueueAccess(role, queue);
    const items = await this.repo.listQueueItems(queue.id);
    return { items, meta: { source: 'internal-admin-shell', queue: queue.slug, count: items.length } };
  }

  async createQueueItem(actorId: string, role: string, dto: any, meta: ReqMeta) {
    const queue = await this.repo.getQueueBySlug(dto.queueSlug);
    if (!queue) throw new NotFoundException({ code: 'queue_not_found' });
    await this.assertQueueAccess(role, queue);
    const item = await this.repo.createQueueItem(queue.id, dto);
    await this.repo.refreshQueueDepths();
    await this.repo.audit({ operatorId: actorId, action: 'queue_item.create', queueSlug: queue.slug, targetType: 'queue_item', targetId: item.id, diff: { reference: item.reference, priority: item.priority }, ip: meta.ip, userAgent: meta.userAgent });
    return item;
  }

  async transitionQueueItem(actorId: string, role: string, dto: { itemId: string; to: string; note?: string }, meta: ReqMeta) {
    const item = await this.repo.getQueueItem(dto.itemId);
    if (!item) throw new NotFoundException({ code: 'queue_item_not_found' });
    const queue = await this.ds_lookup(item.queue_id);
    await this.assertQueueAccess(role, queue);
    const allowed = ITEM_STATE_TRANSITIONS[item.state] ?? [];
    if (!allowed.includes(dto.to)) {
      throw new BadRequestException({ code: 'bad_transition', from: item.state, to: dto.to });
    }
    const after = await this.repo.transitionQueueItem(item.id, dto.to, actorId);
    await this.repo.refreshQueueDepths();
    await this.repo.audit({
      operatorId: actorId, action: 'queue_item.transition', queueSlug: queue.slug,
      targetType: 'queue_item', targetId: item.id,
      diff: { from: item.state, to: dto.to, note: dto.note ?? null },
      ip: meta.ip, userAgent: meta.userAgent,
    });
    return after;
  }

  /** Queue Jump — deterministic claim of the next item across the operator's accessible queues. */
  async queueJump(actorId: string, role: string, dto: { workspaceSlug?: string; domain?: string; priority?: string }, meta: ReqMeta) {
    if (dto.workspaceSlug) {
      const ws = await this.repo.getWorkspaceBySlug(dto.workspaceSlug);
      if (!ws) throw new NotFoundException({ code: 'workspace_not_found' });
      if (!this.roleSatisfies(role, ws.required_role)) throw new ForbiddenException({ code: 'role_insufficient' });
    }
    const claimed = await this.repo.claimNextItem({ ...dto, assigneeId: actorId });
    if (!claimed) {
      return { item: null, meta: { source: 'internal-admin-shell', model: 'queue-jump-v1', reason: 'no_pending_items' } };
    }
    await this.repo.refreshQueueDepths();
    await this.repo.audit({
      operatorId: actorId, action: 'queue.jump', workspaceSlug: dto.workspaceSlug ?? null, queueSlug: null,
      targetType: 'queue_item', targetId: claimed.id, diff: { domain: dto.domain ?? null, priority: dto.priority ?? null },
      ip: meta.ip, userAgent: meta.userAgent,
    });
    return { item: claimed, meta: { source: 'internal-admin-shell', model: 'queue-jump-v1' } };
  }

  // ── Shortcuts ──────────────────────────────────────
  async shortcuts(role: string) {
    const items = await this.repo.listShortcuts(role);
    return { items, meta: { source: 'internal-admin-shell', model: 'shortcuts-v1', role, count: items.length } };
  }
  async upsertShortcut(actorId: string, role: string, dto: any, meta: ReqMeta) {
    if (role !== 'super_admin') throw new ForbiddenException({ code: 'super_admin_required' });
    const r = await this.repo.upsertShortcut(dto);
    await this.repo.audit({ operatorId: actorId, action: 'shortcut.upsert', targetType: 'shortcut', targetId: r.id, diff: dto, ip: meta.ip, userAgent: meta.userAgent });
    return r;
  }

  // ── Audit ──────────────────────────────────────────
  async audit() {
    const items = await this.repo.recentAudit(200);
    return { items, meta: { source: 'internal-admin-shell', model: 'audit-v1', count: items.length } };
  }

  // ── Helpers ────────────────────────────────────────
  private roleSatisfies(actor: string, required: string) {
    const ladder = ['operator','moderator','trust_safety','finance','super_admin'];
    return ladder.indexOf(actor) >= ladder.indexOf(required);
  }
  private async assertQueueAccess(role: string, queue: any) {
    if (!queue) throw new NotFoundException({ code: 'queue_not_found' });
    if (!queue.workspace_id) return;
    const workspaces = await this.repo.listWorkspaces();
    const ws = workspaces.find((w: any) => w.id === queue.workspace_id);
    if (ws && !this.roleSatisfies(role, ws.required_role)) {
      throw new ForbiddenException({ code: 'role_insufficient' });
    }
  }
  private async ds_lookup(queueId: string) {
    const rows = await this.repo.listQueues();
    const q = rows.find((r: any) => r.id === queueId);
    if (!q) throw new NotFoundException({ code: 'queue_not_found' });
    return q;
  }

  // ── Analytics insights (deterministic fallback) ────
  private async fetchInsights(signals: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/internal-admin-shell/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals);
  }
  private fallbackInsights(s: any) {
    const out: any[] = [];
    if ((s.totalDepth ?? 0) > 200) out.push({ id: 'depth_high', severity: 'critical', title: 'Total queue depth above 200 items.' });
    else if ((s.totalDepth ?? 0) > 100) out.push({ id: 'depth_warn', severity: 'warn', title: 'Queue depth elevated.' });
    if ((s.healthBreakdown?.blocked ?? 0) > 0) out.push({ id: 'blocked_queues', severity: 'critical', title: 'One or more queues are blocked — escalate now.' });
    if ((s.healthBreakdown?.degraded ?? 0) > 0) out.push({ id: 'degraded_queues', severity: 'warn', title: 'Queues degraded — staff up.' });
    if (!out.length) out.push({ id: 'shell_healthy', severity: 'success', title: 'Shell posture healthy.' });
    return out;
  }
}
