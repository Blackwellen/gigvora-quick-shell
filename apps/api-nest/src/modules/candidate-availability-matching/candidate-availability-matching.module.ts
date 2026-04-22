import { Module } from '@nestjs/common';
import { CandidateAvailabilityMatchingController } from './candidate-availability-matching.controller';
import { CandidateAvailabilityMatchingService } from './candidate-availability-matching.service';
import { CandidateAvailabilityMatchingRepository } from './candidate-availability-matching.repository';
import { CandidateAvailabilityMatchingMlService } from './candidate-availability-matching.ml.service';
import { CandidateAvailabilityMatchingAnalyticsService } from './candidate-availability-matching.analytics.service';

/**
 * Domain 31 — Open-to-Work, Candidate Availability, Talent Matching Signals.
 * Single-sweep enterprise pack: controller + service + repo + ML matching
 * (with deterministic fallback) + analytics + outbound webhooks + cross-domain
 * bus emissions via D31Emit. Routed workbench at /app/candidate-availability-matching.
 */
@Module({
  controllers: [CandidateAvailabilityMatchingController],
  providers: [
    CandidateAvailabilityMatchingService,
    CandidateAvailabilityMatchingRepository,
    CandidateAvailabilityMatchingMlService,
    CandidateAvailabilityMatchingAnalyticsService,
  ],
  exports: [CandidateAvailabilityMatchingService],
})
export class CandidateAvailabilityMatchingModule {}
