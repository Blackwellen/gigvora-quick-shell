import { Module } from '@nestjs/common';
import { ProjectsBrowseDiscoveryController } from './projects-browse-discovery.controller';
import { ProjectsBrowseDiscoveryService } from './projects-browse-discovery.service';
import { ProjectsBrowseDiscoveryRepository } from './projects-browse-discovery.repository';
import { ProjectsBrowseDiscoveryMlService } from './projects-browse-discovery.ml.service';
import { ProjectsBrowseDiscoveryAnalyticsService } from './projects-browse-discovery.analytics.service';

/**
 * Domain 32 — Projects Browse, Search, and Discovery Marketplace.
 *
 * Single-sweep enterprise pack:
 *   • REST controller (16 endpoints — search, detail, bookmarks, saved
 *     searches, proposals, transitions, flags, invitations, attachments)
 *   • Service layer with explicit state machines + audit emit
 *   • Repository with seeded fixtures (48 projects across 6 clients)
 *   • ML ranking service with deterministic explainable fallback + per-row
 *     match score
 *   • Analytics service powering the right-rail KPI band
 *   • Outbound webhooks (18 `pbd.*` events) + cross-domain bus links via
 *     D32Emit (see projects-browse-discovery.emit.ts)
 *   • Adapter map declared in D32Adapters (storage, av-scanning, search,
 *     email, sms-push, crm, ats-handoff, payments, webhooks)
 *
 * Routed workbench: /app/projects-browse
 */
@Module({
  controllers: [ProjectsBrowseDiscoveryController],
  providers: [
    ProjectsBrowseDiscoveryService,
    ProjectsBrowseDiscoveryRepository,
    ProjectsBrowseDiscoveryMlService,
    ProjectsBrowseDiscoveryAnalyticsService,
  ],
  exports: [ProjectsBrowseDiscoveryService],
})
export class ProjectsBrowseDiscoveryModule {}
