import { Module } from '@nestjs/common';
import { JobApplicationFlowController } from './job-application-flow.controller';
import { JobApplicationFlowService } from './job-application-flow.service';
import { JobApplicationFlowRepository } from './job-application-flow.repository';
import { JobApplicationFlowMlService } from './job-application-flow.ml.service';
import { JobApplicationFlowAnalyticsService } from './job-application-flow.analytics.service';

/**
 * Domain 25 — Job Application Flow, Candidate Forms, Submission Review.
 * Single-sweep pack: controllers/services/repo + ML score+moderate+summarise
 * with deterministic fallbacks, multi-stage review queue, idempotent submit,
 * Socket.IO emits on every transition.
 */
@Module({
  controllers: [JobApplicationFlowController],
  providers: [JobApplicationFlowService, JobApplicationFlowRepository, JobApplicationFlowMlService, JobApplicationFlowAnalyticsService],
  exports: [JobApplicationFlowService],
})
export class JobApplicationFlowModule {}
