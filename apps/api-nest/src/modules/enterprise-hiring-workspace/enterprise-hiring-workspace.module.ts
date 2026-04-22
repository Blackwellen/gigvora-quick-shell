import { Module } from '@nestjs/common';
import { EnterpriseHiringWorkspaceController } from './enterprise-hiring-workspace.controller';
import { EnterpriseHiringWorkspaceService } from './enterprise-hiring-workspace.service';
import { EnterpriseHiringWorkspaceRepository } from './enterprise-hiring-workspace.repository';
import { EnterpriseHiringWorkspaceMlService } from './enterprise-hiring-workspace.ml.service';
import { EnterpriseHiringWorkspaceAnalyticsService } from './enterprise-hiring-workspace.analytics.service';

/**
 * Domain 30-hiring — Enterprise Hiring Workspace, Hiring Manager Collaboration
 * and Approval Chains. Single-sweep pack: controllers/services/repo + ML
 * approval-risk + analytics insights with deterministic fallbacks, multi-step
 * approval workflow with optimistic concurrency, audit, Socket.IO emits on
 * every transition, and outbound webhook + cross-domain bus emissions via
 * D30HiringEmit. The unsuffixed D30 slot remains the cross-cutting integrations
 * pack.
 */
@Module({
  controllers: [EnterpriseHiringWorkspaceController],
  providers: [
    EnterpriseHiringWorkspaceService,
    EnterpriseHiringWorkspaceRepository,
    EnterpriseHiringWorkspaceMlService,
    EnterpriseHiringWorkspaceAnalyticsService,
  ],
  exports: [EnterpriseHiringWorkspaceService],
})
export class EnterpriseHiringWorkspaceModule {}
