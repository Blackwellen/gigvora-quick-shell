import { Module } from '@nestjs/common';
import { RecruiterJobManagementController } from './recruiter-job-management.controller';
import { RecruiterJobManagementService } from './recruiter-job-management.service';
import { RecruiterJobManagementRepository } from './recruiter-job-management.repository';
import { RecruiterJobManagementMlService } from './recruiter-job-management.ml.service';
import { RecruiterJobManagementAnalyticsService } from './recruiter-job-management.analytics.service';

/**
 * Domain 26 — Recruiter Job Management Dashboard and Role Requisition Controls.
 * Single-sweep pack: controllers/services/repo + ML priority+forecast with
 * deterministic fallbacks, multi-step approval workflow, idempotent publish,
 * Socket.IO emits on every transition.
 */
@Module({
  controllers: [RecruiterJobManagementController],
  providers: [RecruiterJobManagementService, RecruiterJobManagementRepository, RecruiterJobManagementMlService, RecruiterJobManagementAnalyticsService],
  exports: [RecruiterJobManagementService],
})
export class RecruiterJobManagementModule {}
