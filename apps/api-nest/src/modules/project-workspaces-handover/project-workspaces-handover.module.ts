import { Module } from '@nestjs/common';
import { ProjectWorkspacesHandoverController } from './project-workspaces-handover.controller';
import { ProjectWorkspacesHandoverService } from './project-workspaces-handover.service';
import { ProjectWorkspacesHandoverRepository } from './project-workspaces-handover.repository';
import { ProjectWorkspacesHandoverAnalyticsService } from './project-workspaces-handover.analytics.service';
import { ProjectWorkspacesHandoverSubscriber } from './project-workspaces-handover.subscriber';

/**
 * Domain 37 — Project Workspaces & Handover.
 * Auto-mints a workspace when D36 (`csa.contract.activated`) activates a
 * contract, owns milestones / deliverables / handover checklist / final
 * report. Escrow release stays owned by D34 + delivery + dispute domains.
 */
@Module({
  controllers: [ProjectWorkspacesHandoverController],
  providers: [
    ProjectWorkspacesHandoverService,
    ProjectWorkspacesHandoverRepository,
    ProjectWorkspacesHandoverAnalyticsService,
    ProjectWorkspacesHandoverSubscriber,
  ],
  exports: [ProjectWorkspacesHandoverService],
})
export class ProjectWorkspacesHandoverModule {}
