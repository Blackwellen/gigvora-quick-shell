import { Module } from '@nestjs/common';
import { JobPostingStudioController } from './job-posting-studio.controller';
import { JobPostingStudioService } from './job-posting-studio.service';
import { JobPostingStudioRepository } from './job-posting-studio.repository';
import { JobPostingStudioMlService } from './job-posting-studio.ml.service';
import { JobPostingStudioAnalyticsService } from './job-posting-studio.analytics.service';

/**
 * Domain 24 — Job Posting Studio, Credits, Recruiter Publication Controls.
 * Multi-step credit checkout (per payment-checkout-pattern rule),
 * Socket.IO publish/approval events, ML quality + moderation with fallback.
 */
@Module({
  controllers: [JobPostingStudioController],
  providers: [JobPostingStudioService, JobPostingStudioRepository, JobPostingStudioMlService, JobPostingStudioAnalyticsService],
  exports: [JobPostingStudioService],
})
export class JobPostingStudioModule {}
