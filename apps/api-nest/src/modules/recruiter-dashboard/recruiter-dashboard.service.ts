import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { RecruiterDashboardRepository } from './recruiter-dashboard.repository';
import {
  PIPELINE_TRANSITIONS, TASK_TRANSITIONS,
  PipelineStatus, TaskStatus,
  TransitionPipelineDto, TransitionTaskDto,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';
const ML_BASE = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';

@Injectable()
export class RecruiterDashboardService {
  private readonly logger = new Logger(RecruiterDashboardService.name);

  constructor(private readonly repo: RecruiterDashboardRepository) {}

  async overview(recruiterId: string, windowDays = 30) {
    const [pipelinesPage, funnelRaw, tasks] = await Promise.all([
      this.repo.listPipelines(recruiterId, { page: 1, pageSize: 50 }),
      this.repo.outreachFunnel(recruiterId, windowDays).catch(() => []),
      this.repo.listTasks(recruiterId, { status: 'open' }),
    ]);

    const pipelines = pipelinesPage.items;
    const active = pipelines.filter((p: any) => p.status === 'active');
    const totalActiveCandidates = active.reduce((s: number, p: any) => s + (p.activeCandidates || 0), 0);
    const totalHired = pipelines.reduce((s: number, p: any) => s + (p.hiredCount || 0), 0);
    const avgDaysToFill = (() => {
      const vals = pipelines.map((p: any) => Number(p.averageDaysToFill || 0)).filter(Boolean);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    })();

    const funnel: Record<string, { count: number; avgResponseHours: number | null }> = {};
    let sent = 0, replied = 0;
    for (const row of (funnelRaw as any[]) ?? []) {
      const count = Number(row.count ?? 0);
      funnel[row.status] = { count, avgResponseHours: row.avg_response_hours ?? row.avgResponseHours ?? null };
      if (['sent', 'opened', 'replied', 'bounced'].includes(row.status)) sent += count;
      if (row.status === 'replied') replied += count;
    }
    const responseRate = sent > 0 ? Math.round((replied / sent) * 1000) / 10 : 0;

    const insights = await this.fetchInsights(recruiterId, { activePipelines: active.length, totalActiveCandidates, responseRate, openTasks: tasks.length, avgDaysToFill, windowDays })
      .catch(() => this.fallbackInsights({ responseRate, openTasks: tasks.length, avgDaysToFill }));

    return {
      windowDays,
      kpis: {
        activePipelines: active.length,
        totalActiveCandidates,
        totalHired,
        responseRate,
        avgDaysToFill,
        openTasks: tasks.length,
        urgentTasks: tasks.filter((t: any) => t.priority === 'urgent').length,
      },
      pipelines: pipelines.slice(0, 8),
      funnel,
      tasks: tasks.slice(0, 12),
      insights,
      computedAt: new Date().toISOString(),
    };
  }

  private async fetchInsights(recruiterId: string, signals: any) {
    try {
      const res = await fetch(`${ANALYTICS_BASE}/recruiter-dashboard/insights`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recruiter_id: recruiterId, signals }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return (await res.json()).insights ?? [];
    } catch (e) {
      this.logger.warn(`analytics insights unavailable: ${(e as Error).message}`);
    }
    return this.fallbackInsights(signals);
  }

  private fallbackInsights(signals: { responseRate: number; openTasks: number; avgDaysToFill: number }) {
    const out: any[] = [];
    if (signals.responseRate < 15 && signals.responseRate > 0) {
      out.push({ id: 'low-response', severity: 'warn', title: `Response rate ${signals.responseRate}%`, body: 'Refresh outreach templates and re-segment your sourcing list.' });
    }
    if (signals.openTasks >= 10) {
      out.push({ id: 'task-backlog', severity: 'warn', title: `${signals.openTasks} open tasks`, body: 'Triage now before SLA slips.' });
    }
    if (signals.avgDaysToFill > 35) {
      out.push({ id: 'slow-fill', severity: 'info', title: `Avg ${signals.avgDaysToFill}d to fill`, body: 'Investigate stage bottlenecks in the velocity panel.' });
    }
    if (!out.length) {
      out.push({ id: 'all-clear', severity: 'success', title: 'Recruiter cockpit is healthy', body: 'No outstanding signals.' });
    }
    return out;
  }

  // Pipelines
  async listPipelines(recruiterId: string, q: any) { return this.repo.listPipelines(recruiterId, q); }

  async transitionPipeline(recruiterId: string, id: string, dto: TransitionPipelineDto, actorId: string) {
    const current = await this.repo.getPipeline(recruiterId, id);
    if (!current) throw new NotFoundException('pipeline not found');
    const allowed = PIPELINE_TRANSITIONS[current.status as PipelineStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid transition: ${current.status} → ${dto.status}`);
    }
    const row = await this.repo.updatePipelineStatus(id, dto.status);
    await this.repo.recordEvent(recruiterId, actorId, `pipeline.${dto.status}`, { type: 'pipeline', id }, { from: current.status, to: dto.status, reason: dto.reason });
    return row;
  }

  // Outreach + ML reply prediction
  async outreach(recruiterId: string, q: any) {
    const page = await this.repo.listOutreach(recruiterId, q);
    if (page.items.length) {
      try {
        const enriched = await this.predictReplies(page.items);
        const byId = new Map(enriched.map((e: any) => [e.id, e.replyProbability]));
        page.items = page.items.map((o: any) => ({ ...o, replyProbability: byId.get(o.id) ?? null }));
      } catch { /* keep raw */ }
    }
    return page;
  }

  private async predictReplies(items: any[]): Promise<{ id: string; replyProbability: number }[]> {
    try {
      const res = await fetch(`${ML_BASE}/recruiter-dashboard/predict-replies`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items }),
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const data = await res.json();
        return data.predictions ?? [];
      }
    } catch { /* fall through */ }
    // Deterministic fallback: channel + status base rates.
    return items.map((it) => {
      const base = it.channel === 'email' ? 0.18 : it.channel === 'inmail' ? 0.22 : it.channel === 'sms' ? 0.32 : 0.45;
      const opened = it.status === 'opened' ? 0.15 : 0;
      return { id: it.id, replyProbability: Math.round((base + opened) * 1000) / 1000 };
    });
  }

  // Velocity
  velocity(recruiterId: string, q: any) { return this.repo.listVelocity(recruiterId, q); }

  // Tasks
  listTasks(recruiterId: string, q: any) { return this.repo.listTasks(recruiterId, q); }

  async transitionTask(recruiterId: string, id: string, dto: TransitionTaskDto, actorId: string) {
    const current = await this.repo.getTask(recruiterId, id);
    if (!current) throw new NotFoundException('task not found');
    const allowed = TASK_TRANSITIONS[current.status as TaskStatus] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`invalid task transition: ${current.status} → ${dto.status}`);
    }
    const row = await this.repo.updateTaskStatus(id, dto.status, dto.snoozedUntil);
    await this.repo.recordEvent(recruiterId, actorId, `task.${dto.status}`, { type: 'task', id }, { from: current.status, to: dto.status, note: dto.note });
    return row;
  }
}
