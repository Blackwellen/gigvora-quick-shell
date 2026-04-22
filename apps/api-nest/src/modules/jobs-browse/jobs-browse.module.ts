import { Module } from '@nestjs/common';
import { JobsBrowseController } from './jobs-browse.controller';
import { JobsBrowseService } from './jobs-browse.service';
import { JobsBrowseRepository } from './jobs-browse.repository';
import { JobsBrowseMlService } from './jobs-browse.ml.service';
import { JobsBrowseAnalyticsService } from './jobs-browse.analytics.service';

/**
 * Domain 23 — Jobs Marketplace Browse, Discovery, and Saved Search Surfaces.
 * Bound to NotificationsGateway via DI token 'NOTIFICATIONS_GATEWAY'.
 */
@Module({
  controllers: [JobsBrowseController],
  providers: [JobsBrowseService, JobsBrowseRepository, JobsBrowseMlService, JobsBrowseAnalyticsService],
  exports: [JobsBrowseService],
})
export class JobsBrowseModule {}
