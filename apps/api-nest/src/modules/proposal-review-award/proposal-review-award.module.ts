import { Module } from '@nestjs/common';
import { ProposalReviewAwardController } from './proposal-review-award.controller';
import { ProposalReviewAwardService } from './proposal-review-award.service';
import { ProposalReviewAwardRepository } from './proposal-review-award.repository';
import { ProposalReviewAwardMlService } from './proposal-review-award.ml.service';
import { ProposalReviewAwardAnalyticsService } from './proposal-review-award.analytics.service';
import { ProposalBuilderBidCreditsModule } from '../proposal-builder-bid-credits/proposal-builder-bid-credits.module';

/**
 * Domain 35 — Proposal Review, Compare, Shortlist & Award Decisions.
 * Imports D34 module so the award handoff can place the escrow hold via
 * the existing ProposalBuilderBidCreditsService.
 */
@Module({
  imports: [ProposalBuilderBidCreditsModule],
  controllers: [ProposalReviewAwardController],
  providers: [
    ProposalReviewAwardService,
    ProposalReviewAwardRepository,
    ProposalReviewAwardMlService,
    ProposalReviewAwardAnalyticsService,
  ],
  exports: [ProposalReviewAwardService],
})
export class ProposalReviewAwardModule {}
