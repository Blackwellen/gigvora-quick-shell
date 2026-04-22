import { Injectable, NotFoundException } from '@nestjs/common';
import { SalesNavigatorRepository } from './sales-navigator.repository';

@Injectable()
export class SalesNavigatorService {
  constructor(private readonly repo: SalesNavigatorRepository) {}

  // Deterministic intent + fit recompute (so the API path is always defensible
  // even if the ML service is offline).
  recomputeScores(lead: any, signals: any[] = []): { intent: number; fit: number } {
    const recentSignal = signals
      .filter((s) => s.company_id === lead.company_id)
      .sort((a, b) => +new Date(b.detected_at) - +new Date(a.detected_at))[0];
    const intent = Math.min(100,
      (recentSignal?.severity ?? 0) * 0.6 +
      (lead.last_activity_at ? 30 : 0) +
      (lead.tags?.length ?? 0) * 2,
    );
    const fit = Math.min(100,
      (lead.seniority ? 30 : 0) +
      (lead.title ? 15 : 0) +
      (lead.industry ? 15 : 0) +
      (lead.email ? 20 : 0) +
      (lead.linkedin_url ? 20 : 0),
    );
    return { intent: Math.round(intent), fit: Math.round(fit) };
  }

  async overview(ownerId: string) {
    const leads = await this.repo.listLeads(ownerId, { page: 1, page_size: 100 });
    const sequences = await this.repo.listSequences(ownerId);
    const goals = await this.repo.listGoals(ownerId);
    const activities = await this.repo.listActivities(ownerId);
    const byStatus: Record<string, number> = {};
    for (const l of leads.items) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
    const replied = activities.filter((a: any) => a.status === 'replied').length;
    const sent = activities.filter((a: any) => ['sent','delivered','opened','replied'].includes(a.status)).length;
    return {
      data: {
        totals: { leads: leads.meta.count, sequences: sequences.length, goals: goals.length, activities: activities.length },
        leadsByStatus: byStatus,
        outreach: { sent, replied, replyRate: sent ? Math.round((replied / sent) * 1000) / 10 : 0 },
      },
      meta: { source: 'sales_navigator.service', model: 'sn-overview-v1-deterministic' },
    };
  }

  async createLead(ownerId: string, data: any) {
    const lead = await this.repo.createLead(ownerId, data);
    const { intent, fit } = this.recomputeScores(lead, []);
    await this.repo.updateLead(ownerId, lead.id, { intent_score: intent, fit_score: fit });
    await this.repo.audit(ownerId, 'lead.create', 'lead', lead.id, { name: data.full_name });
    return { ...lead, intent_score: intent, fit_score: fit };
  }

  async ensureLead(ownerId: string, id: string) {
    const lead = await this.repo.getLead(ownerId, id);
    if (!lead) throw new NotFoundException('lead not found');
    return lead;
  }
}
