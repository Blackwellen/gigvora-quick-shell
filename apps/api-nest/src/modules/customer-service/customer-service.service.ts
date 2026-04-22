import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CustomerServiceRepository } from './customer-service.repository';
import { CsTasksRepository } from './cs-tasks.repository';
import { TICKET_TRANSITIONS } from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE        = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

type Meta = { ip?: string; userAgent?: string };

/**
 * Domain 67 — Customer Service Dashboard.
 * Role ladder: customer < agent < lead < trust_safety < super_admin.
 * - Customers (requesters) only see their own tickets and post `customer` messages.
 * - Agents+ see/queue all tickets, post `internal` notes, and run state transitions.
 * - Agents+ also own the delegated-tasks queue (cs_tasks).
 */
@Injectable()
export class CustomerServiceService {
  private readonly logger = new Logger(CustomerServiceService.name);
  constructor(
    private readonly repo: CustomerServiceRepository,
    private readonly tasksRepo: CsTasksRepository,
  ) {}

  // ── Dashboard overview ────────────────────────────
  async overview(role: string) {
    this.assertOperator(role);
    const [kpis, queues, recent] = await Promise.all([
      this.repo.kpis(),
      this.repo.list({ pageSize: 0, page: 1 }).then(() => this.queueDepths()),
      this.repo.list({ pageSize: 10, page: 1, status: 'pending' }),
    ]);
    const insights = await this.fetchInsights(kpis).catch(() => this.fallbackInsights(kpis));
    return { kpis, queues, recent: recent.items, insights, computedAt: new Date().toISOString() };
  }

  private async queueDepths() {
    const rows = await this.repo.list({ pageSize: 0, page: 1 });
    void rows;
    const all = await (this.repo as any).ds_or?.() ?? null;
    void all;
    // Compute via list with grouping is overkill — derive from kpis-style query in repo extension.
    const kpis = await this.repo.kpis();
    return Object.entries(kpis.byStatus ?? {}).map(([status, count]) => ({ status, count }));
  }

  // ── List + detail ─────────────────────────────────
  async list(role: string, requesterId: string, filter: any) {
    // Customers can only see their own tickets.
    const scoped = this.isOperator(role) ? filter : { ...filter, requesterId };
    const r = await this.repo.list(scoped);
    return {
      items: r.items, total: r.total,
      meta: { source: 'customer-service', role, page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 },
    };
  }

  async detail(role: string, requesterId: string, ticketId: string) {
    const t = await this.repo.byId(ticketId);
    if (!t) throw new NotFoundException({ code: 'ticket_not_found' });
    if (!this.isOperator(role) && t.requester_id !== requesterId) {
      throw new ForbiddenException({ code: 'not_owner' });
    }
    const [messages, events] = await Promise.all([
      this.repo.listMessages(ticketId).then((rows) => this.isOperator(role) ? rows : rows.filter((m: any) => m.visibility === 'public')),
      this.isOperator(role) ? this.repo.listEvents(ticketId) : Promise.resolve([]),
    ]);
    return { ticket: t, messages, events };
  }

  // ── Create / mutate ───────────────────────────────
  async create(actorId: string, role: string, dto: any, meta: Meta) {
    const ticket = await this.repo.create({ ...dto, requesterId: actorId });
    await this.repo.event(ticket.id, actorId, 'ticket.create', { category: ticket.category, priority: ticket.priority, ip: meta.ip });
    return ticket;
  }

  async update(actorId: string, role: string, dto: { ticketId: string; patch: any }, meta: Meta) {
    this.assertOperator(role);
    const before = await this.repo.byId(dto.ticketId);
    if (!before) throw new NotFoundException({ code: 'ticket_not_found' });
    const after = await this.repo.update(dto.ticketId, dto.patch);
    await this.repo.event(after.id, actorId, 'ticket.update', { patch: dto.patch, ip: meta.ip, ua: meta.userAgent });
    return after;
  }

  async transition(actorId: string, role: string, dto: { ticketId: string; to: string; note?: string }, meta: Meta) {
    const t = await this.repo.byId(dto.ticketId);
    if (!t) throw new NotFoundException({ code: 'ticket_not_found' });
    // Customers may only reopen their own resolved/closed ticket.
    if (!this.isOperator(role)) {
      if (t.requester_id !== actorId) throw new ForbiddenException({ code: 'not_owner' });
      if (dto.to !== 'reopened') throw new ForbiddenException({ code: 'customer_cannot_transition' });
    }
    const allowed = TICKET_TRANSITIONS[t.status] ?? [];
    if (!allowed.includes(dto.to)) {
      throw new BadRequestException({ code: 'bad_transition', from: t.status, to: dto.to });
    }
    const after = await this.repo.transition(dto.ticketId, dto.to);
    await this.repo.event(after.id, actorId, 'ticket.transition', { from: t.status, to: dto.to, note: dto.note ?? null, ip: meta.ip });
    return after;
  }

  async postMessage(actorId: string, role: string, dto: any, meta: Meta) {
    const t = await this.repo.byId(dto.ticketId);
    if (!t) throw new NotFoundException({ code: 'ticket_not_found' });
    const isCustomer = !this.isOperator(role);
    if (isCustomer && t.requester_id !== actorId) throw new ForbiddenException({ code: 'not_owner' });
    const visibility = isCustomer ? 'public' : (dto.visibility ?? 'public');
    const authorKind = isCustomer ? 'customer' : 'agent';
    const m = await this.repo.postMessage(dto.ticketId, actorId, authorKind, dto.body, visibility, dto.attachments ?? []);
    await this.repo.event(t.id, actorId, 'ticket.message', { visibility, ip: meta.ip });
    // If a customer replies on a waiting ticket, auto-flip back to active.
    if (isCustomer && t.status === 'waiting_customer') {
      await this.repo.transition(t.id, 'active');
      await this.repo.event(t.id, actorId, 'ticket.transition', { from: 'waiting_customer', to: 'active', auto: true });
    }
    return m;
  }

  // ── Macros ────────────────────────────────────────
  async macros(role: string) {
    this.assertOperator(role);
    const items = await this.repo.listMacros();
    return { items, meta: { source: 'customer-service', count: items.length } };
  }

  // ── Suggest priority via ML (deterministic fallback) ──
  async suggestPriority(subject: string, body: string) {
    try {
      const r = await fetch(`${ML_BASE}/customer-service/suggest-priority`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject, body }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return await r.json();
    } catch (e) { this.logger.warn(`ml down: ${(e as Error).message}`); }
    return this.fallbackPriority(subject, body);
  }
  private fallbackPriority(subject: string, body: string) {
    const t = `${subject} ${body}`.toLowerCase();
    let score = 30; const reasons: string[] = [];
    if (/(urgent|asap|now|critical|down|broken|blocked|locked)/.test(t)) { score += 40; reasons.push('urgency_keywords'); }
    if (/(refund|charge|money|withdraw|payment|invoice)/.test(t))        { score += 25; reasons.push('financial_topic'); }
    if (/(security|hack|breach|leak|abuse|fraud)/.test(t))               { score += 30; reasons.push('safety_topic'); }
    score = Math.min(100, score);
    const priority = score >= 80 ? 'urgent' : score >= 55 ? 'high' : score >= 30 ? 'normal' : 'low';
    return { priority, score, reasons, model: 'deterministic-v1' };
  }

  // ── Insights ──────────────────────────────────────
  private async fetchInsights(kpis: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/customer-service/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ signals: kpis }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(kpis);
  }
  private fallbackInsights(k: any) {
    const out: any[] = [];
    if ((k.breaches ?? 0) > 5) out.push({ id: 'sla_breach', severity: 'critical', title: `${k.breaches} tickets breached SLA — escalate now.` });
    else if ((k.breaches ?? 0) > 0) out.push({ id: 'sla_warn', severity: 'warn', title: `${k.breaches} tickets breaching SLA.` });
    const urgent = k.byPriority?.urgent ?? 0;
    if (urgent > 0) out.push({ id: 'urgent_open', severity: 'warn', title: `${urgent} urgent open tickets.` });
    if (k.csat?.count >= 5 && k.csat?.avg !== null && k.csat.avg < 3.5) {
      out.push({ id: 'csat_low', severity: 'warn', title: `CSAT ${k.csat.avg.toFixed(2)} below 3.5 threshold.` });
    }
    if (!out.length) out.push({ id: 'cs_healthy', severity: 'success', title: 'Customer service posture healthy.' });
    return out;
  }

  // ── Delegated tasks (operator-only) ───────────────
  async listTasks(role: string, filter: any) {
    this.assertOperator(role);
    const r = await this.tasksRepo.list(filter);
    return { items: r.items, total: r.total, meta: { source: 'cs-tasks', role, page: filter.page, pageSize: filter.pageSize } };
  }
  async createTask(actorId: string, role: string, dto: any) {
    this.assertOperator(role);
    return this.tasksRepo.create({ ...dto, createdBy: actorId });
  }
  async updateTask(_actorId: string, role: string, dto: { taskId: string; patch: any }) {
    this.assertOperator(role);
    const before = await this.tasksRepo.byId(dto.taskId);
    if (!before) throw new NotFoundException({ code: 'task_not_found' });
    return this.tasksRepo.update(dto.taskId, dto.patch);
  }

  // ── Helpers ───────────────────────────────────────
  private isOperator(role: string) { return ['agent','lead','trust_safety','super_admin'].includes(role); }
  private assertOperator(role: string) {
    if (!this.isOperator(role)) throw new ForbiddenException({ code: 'operator_required' });
  }
}

