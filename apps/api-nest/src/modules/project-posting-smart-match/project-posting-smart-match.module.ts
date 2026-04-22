import { Module } from '@nestjs/common';
import { ProjectPostingSmartMatchController } from './project-posting-smart-match.controller';
import { ProjectPostingSmartMatchService } from './project-posting-smart-match.service';
import { ProjectPostingSmartMatchRepository } from './project-posting-smart-match.repository';
import { ProjectPostingSmartMatchMlService } from './project-posting-smart-match.ml.service';
import { ProjectPostingSmartMatchAnalyticsService } from './project-posting-smart-match.analytics.service';

/**
 * Domain 33 — Project Posting Studio, Smart Match & Invite Flows.
 *
 * Single-sweep enterprise pack:
 *   • REST controller (24 endpoints)
 *   • Service with explicit project / invite / approval / purchase state machines
 *   • Repository with seeded candidates, projects, invites, ledger, audit
 *   • ML smart-match (deterministic explainable fallback + diversify)
 *   • Analytics (KPI band, accept rate, anomaly note, boost wallet)
 *   • Outbound webhooks (26 `pps.*` events) + cross-domain bus via D33Emit
 *   • Multi-step boost-credit checkout (createPurchase → confirmPurchase + idempotency)
 *   • Adapter map declared in D33Adapters
 */
@Module({
  controllers: [ProjectPostingSmartMatchController],
  providers: [
    ProjectPostingSmartMatchService,
    ProjectPostingSmartMatchRepository,
    ProjectPostingSmartMatchMlService,
    ProjectPostingSmartMatchAnalyticsService,
  ],
  exports: [ProjectPostingSmartMatchService],
})
export class ProjectPostingSmartMatchModule {}
