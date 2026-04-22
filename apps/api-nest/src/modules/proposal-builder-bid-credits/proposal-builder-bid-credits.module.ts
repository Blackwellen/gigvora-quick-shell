import { Module } from '@nestjs/common';
import { ProposalBuilderBidCreditsController } from './proposal-builder-bid-credits.controller';
import { ProposalBuilderBidCreditsService } from './proposal-builder-bid-credits.service';
import { ProposalBuilderBidCreditsRepository } from './proposal-builder-bid-credits.repository';
import { ProposalBuilderBidCreditsMlService } from './proposal-builder-bid-credits.ml.service';
import { ProposalBuilderBidCreditsAnalyticsService } from './proposal-builder-bid-credits.analytics.service';

/**
 * Domain 34 — Proposal Builder, Bid Credits, Scope Entry & Pricing Submission.
 *
 * Single-sweep enterprise pack:
 *   • REST controller (~22 endpoints)
 *   • Service with explicit proposal / purchase / escrow state machines
 *   • Repository with seeded proposals, credit ledger, escrow ledger, audit
 *   • ML pricing-advice (deterministic explainable fallback)
 *   • Analytics (KPI band, win rate, runway, anomaly note)
 *   • Outbound webhooks (~30 `pbb.*` events) + cross-domain bus via D34Emit
 *   • Multi-step bid-credit checkout (createPurchase → confirmPurchase + idempotency)
 *   • Full escrow surface: hold → release / refund (with partial-release support)
 *   • Adapter map declared in D34Adapters
 */
@Module({
  controllers: [ProposalBuilderBidCreditsController],
  providers: [
    ProposalBuilderBidCreditsService,
    ProposalBuilderBidCreditsRepository,
    ProposalBuilderBidCreditsMlService,
    ProposalBuilderBidCreditsAnalyticsService,
  ],
  exports: [ProposalBuilderBidCreditsService],
})
export class ProposalBuilderBidCreditsModule {}
