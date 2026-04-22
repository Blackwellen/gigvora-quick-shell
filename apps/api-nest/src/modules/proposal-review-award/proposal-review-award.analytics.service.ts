/**
 * D35 — Analytics service. Powers the workbench KPI band:
 *   #submitted / #shortlisted / #awarded, median bid, decision velocity,
 *   and an anomaly note when shortlist size is too narrow or too wide.
 */
import { Injectable } from '@nestjs/common';
import { ProposalReviewAwardRepository } from './proposal-review-award.repository';

@Injectable()
export class ProposalReviewAwardAnalyticsService {
  constructor(private readonly repo: ProposalReviewAwardRepository) {}

  insights(tenantId: string, projectId?: string) {
    const rows = this.repo.list(tenantId, { projectId });
    const submitted   = rows.filter((r) => r.status === 'submitted').length;
    const shortlisted = rows.filter((r) => r.status === 'shortlisted').length;
    const rejected    = rows.filter((r) => r.status === 'rejected').length;
    const awarded     = rows.filter((r) => r.status === 'awarded').length;
    const declined    = rows.filter((r) => r.status === 'declined').length;
    const bids = rows.map((r) => r.bidAmountCents).sort((a, b) => a - b);
    const median = bids.length ? bids[Math.floor(bids.length / 2)] : 0;
    const decisions = rows.filter((r) => r.status !== 'submitted');
    const velocity = decisions.length
      ? Math.round(decisions.reduce((s, r) => s + Math.max(1, (Date.parse(r.updatedAt) - Date.parse(r.createdAt)) / 3_600_000), 0) / decisions.length)
      : 0;
    let anomalyNote: string | null = null;
    if (rows.length >= 4 && shortlisted === 0) anomalyNote = 'No shortlist yet — review at least the top three to keep the project moving.';
    else if (rows.length && shortlisted / rows.length > 0.6) anomalyNote = 'Shortlist is wider than 60% of the cohort — narrow it before awarding.';
    else if (awarded === 0 && shortlisted >= 1 && velocity > 72) anomalyNote = `Decisions are taking ${velocity}h on average — consider auto-rejecting expired proposals.`;
    return {
      submitted, shortlisted, rejected, awarded, declined,
      total: rows.length, medianBidCents: median,
      decisionVelocityHours: velocity,
      anomalyNote,
      generatedAt: new Date().toISOString(), mode: 'fallback',
    };
  }
}
