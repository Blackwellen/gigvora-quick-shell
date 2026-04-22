/**
 * Domain 30-hiring analytics — operational summaries for the dashboard.
 * Bridges to apps/analytics-python/app/enterprise_hiring.py with a
 * deterministic local fallback so the dashboard always renders.
 */
import { Injectable, Logger } from '@nestjs/common';
import type {
  ApprovalRequestRow, ApprovalStepRow, ThreadRow, WorkspaceRow,
} from './enterprise-hiring-workspace.repository';

export interface DashboardInsights {
  workspaces: { active: number; archived: number; draft: number };
  approvals: {
    pending: number; inReview: number; approved: number;
    rejected: number; expired: number; cancelled: number;
    medianHoursToDecide: number | null;
    overdue: number;
  };
  threads: { open: number; resolved: number; closed: number; unread: number };
  topApproverBacklog: Array<{ approverId: string; pending: number }>;
  source: 'analytics' | 'fallback';
}

@Injectable()
export class EnterpriseHiringWorkspaceAnalyticsService {
  private readonly log = new Logger('EHWAnalytics');
  private readonly base = process.env.ANALYTICS_PYTHON_URL ?? '';
  private readonly enabled = !!this.base;

  async insights(input: {
    workspaces: WorkspaceRow[];
    requests: ApprovalRequestRow[];
    steps: ApprovalStepRow[];
    threads: ThreadRow[];
  }): Promise<DashboardInsights> {
    if (this.enabled) {
      try {
        const res = await fetch(`${this.base}/analytics/enterprise-hiring/insights`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(2500),
        });
        if (res.ok) {
          const data = (await res.json()) as DashboardInsights;
          return { ...data, source: 'analytics' };
        }
      } catch (e) {
        this.log.warn(`analytics.insights fell back: ${(e as Error).message}`);
      }
    }
    return this.local(input);
  }

  private local(input: {
    workspaces: WorkspaceRow[]; requests: ApprovalRequestRow[];
    steps: ApprovalStepRow[]; threads: ThreadRow[];
  }): DashboardInsights {
    const ws = { active: 0, archived: 0, draft: 0 };
    for (const w of input.workspaces) ws[w.status] = (ws as any)[w.status] + 1;

    const ap = { pending: 0, inReview: 0, approved: 0, rejected: 0, expired: 0, cancelled: 0, medianHoursToDecide: null as number | null, overdue: 0 };
    const decided: number[] = [];
    const now = Date.now();
    for (const r of input.requests) {
      if (r.status === 'pending') ap.pending++;
      else if (r.status === 'in_review') ap.inReview++;
      else if (r.status === 'approved') ap.approved++;
      else if (r.status === 'rejected') ap.rejected++;
      else if (r.status === 'expired') ap.expired++;
      else if (r.status === 'cancelled') ap.cancelled++;
      if ((r.status === 'approved' || r.status === 'rejected') && r.createdAt && r.updatedAt) {
        decided.push((Date.parse(r.updatedAt) - Date.parse(r.createdAt)) / 36e5);
      }
      if ((r.status === 'pending' || r.status === 'in_review') && r.dueAt && Date.parse(r.dueAt) < now) ap.overdue++;
    }
    if (decided.length) {
      const sorted = [...decided].sort((a, b) => a - b);
      ap.medianHoursToDecide = Number(sorted[Math.floor(sorted.length / 2)].toFixed(1));
    }

    const th = { open: 0, resolved: 0, closed: 0, unread: 0 };
    for (const t of input.threads) {
      th[t.status]++;
      th.unread += t.unreadCount;
    }

    const backlog = new Map<string, number>();
    for (const s of input.steps) {
      if (s.status === 'in_review' || s.status === 'pending') {
        for (const aId of s.approverIds) backlog.set(aId, (backlog.get(aId) ?? 0) + 1);
      }
    }
    const topApproverBacklog = [...backlog.entries()]
      .map(([approverId, pending]) => ({ approverId, pending }))
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 5);

    return { workspaces: ws, approvals: ap, threads: th, topApproverBacklog, source: 'fallback' };
  }
}
