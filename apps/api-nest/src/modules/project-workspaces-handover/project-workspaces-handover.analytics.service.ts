/**
 * D37 analytics — workspace velocity, milestone funnel, handover readiness.
 */
import { Injectable } from '@nestjs/common';
import { ProjectWorkspacesHandoverRepository } from './project-workspaces-handover.repository';

@Injectable()
export class ProjectWorkspacesHandoverAnalyticsService {
  constructor(private readonly repo: ProjectWorkspacesHandoverRepository) {}

  insights(tenantId: string, projectId?: string) {
    const rows = this.repo.list(tenantId, { projectId });
    const buckets = { kickoff: 0, active: 0, inReview: 0, handover: 0, closed: 0, onHold: 0, cancelled: 0 };
    let totalMilestones = 0; let acceptedMilestones = 0;
    let totalDeliverables = 0; let acceptedDeliverables = 0;
    let checklistDone = 0; let checklistTotal = 0;
    let cycleMs = 0; let cycleSamples = 0;
    for (const r of rows) {
      switch (r.status) {
        case 'kickoff': buckets.kickoff++; break;
        case 'active': buckets.active++; break;
        case 'in-review': buckets.inReview++; break;
        case 'handover': buckets.handover++; break;
        case 'closed': buckets.closed++; break;
        case 'on-hold': buckets.onHold++; break;
        case 'cancelled': buckets.cancelled++; break;
      }
      const ms = this.repo.milestonesFor(r.id);
      totalMilestones += ms.length;
      acceptedMilestones += ms.filter((x) => x.status === 'accepted').length;
      const ds = this.repo.deliverablesFor(r.id);
      totalDeliverables += ds.length;
      acceptedDeliverables += ds.filter((x) => x.status === 'accepted').length;
      const ck = this.repo.checklistFor(r.id);
      checklistTotal += ck.length;
      checklistDone += ck.filter((x) => x.done).length;
      if (r.closedAt) { cycleMs += new Date(r.closedAt).getTime() - new Date(r.createdAt).getTime(); cycleSamples++; }
    }
    return {
      ...buckets,
      total: rows.length,
      milestoneAcceptanceRatePct: totalMilestones ? Math.round((acceptedMilestones / totalMilestones) * 100) : 0,
      deliverableAcceptanceRatePct: totalDeliverables ? Math.round((acceptedDeliverables / totalDeliverables) * 100) : 0,
      handoverReadinessPct: checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0,
      avgCycleDays: cycleSamples ? Math.round((cycleMs / cycleSamples) / 86_400_000 * 10) / 10 : 0,
      generatedAt: new Date().toISOString(),
      mode: 'in-process',
    };
  }
}
