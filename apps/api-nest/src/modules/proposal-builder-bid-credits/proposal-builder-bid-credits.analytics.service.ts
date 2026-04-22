/**
 * D34 — Analytics / KPI service. Powers the proposal builder's right-rail
 * KPI band, credit + boost wallet, and an anomaly note for credit burn-down.
 */
import { Injectable } from '@nestjs/common';
import { ProposalBuilderBidCreditsRepository, PROPOSAL_COST } from './proposal-builder-bid-credits.repository';

@Injectable()
export class ProposalBuilderBidCreditsAnalyticsService {
  constructor(private readonly repo: ProposalBuilderBidCreditsRepository) {}

  insights(tenantId: string) {
    const all = this.repo.list(tenantId);
    const drafts = all.filter((p) => p.status === 'draft').length;
    const submitted = all.filter((p) => p.status === 'submitted').length;
    const shortlisted = all.filter((p) => p.status === 'shortlisted').length;
    const accepted = all.filter((p) => p.status === 'accepted').length;
    const rejected = all.filter((p) => p.status === 'rejected').length;
    const decided = accepted + rejected;
    const winRate = decided ? Math.round((accepted / decided) * 100) : 0;
    const ledger = this.repo.ledgerFor(tenantId).filter((l) => l.kind === 'credit');
    const last14d = ledger.filter((l) => Date.parse(l.at) > Date.now() - 14 * 86_400_000);
    const burnDown = last14d.filter((l) => l.delta < 0).reduce((s, l) => s - l.delta, 0);
    const balance = this.repo.creditBalanceOf(tenantId);
    const dailyBurn = burnDown / 14;
    const runwayDays = dailyBurn > 0 ? Math.floor(balance / dailyBurn) : null;
    let anomalyNote: string | null = null;
    if (runwayDays != null && runwayDays < 7 && balance > 0) {
      anomalyNote = `Credit runway is ${runwayDays} days at current burn — top up to keep submitting.`;
    } else if (balance < PROPOSAL_COST) {
      anomalyNote = 'Out of credits — purchase a pack before submitting your next proposal.';
    }
    return {
      drafts, submitted, shortlisted, accepted, rejected, winRate,
      creditBalance: balance, boostBalance: this.repo.boostBalanceOf(tenantId),
      proposalCost: PROPOSAL_COST,
      burnDown14d: burnDown, runwayDays,
      anomalyNote, generatedAt: new Date().toISOString(), mode: 'fallback',
    };
  }
}
