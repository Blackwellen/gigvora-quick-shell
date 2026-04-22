import { Module } from '@nestjs/common';
import { GigsBrowseController } from './gigs-browse.controller';
import { GigsBrowseService } from './gigs-browse.service';
import { GigsBrowseRepository } from './gigs-browse.repository';
import { GigsBrowseMlService } from './gigs-browse.ml.service';
import { GigsBrowseAnalyticsService } from './gigs-browse.analytics.service';

/**
 * Domain 41 — Gigs Browse, Search, and Marketplace Discovery.
 * Bound (when present) to NotificationsGateway via 'NOTIFICATIONS_GATEWAY' and
 * the search-indexer Bull queue via 'INDEXING_QUEUE' (both optional).
 */
@Module({
  controllers: [GigsBrowseController],
  providers: [GigsBrowseService, GigsBrowseRepository, GigsBrowseMlService, GigsBrowseAnalyticsService],
  exports: [GigsBrowseService],
})
export class GigsBrowseModule {}
