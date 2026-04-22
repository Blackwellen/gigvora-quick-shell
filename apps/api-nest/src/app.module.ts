import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { IdentityModule } from './modules/identity/identity.module';
import { EntitlementsModule } from './modules/entitlements/entitlements.module';
import { SearchModule } from './modules/search/search.module';
import { OverlaysModule } from './modules/overlays/overlays.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { FeedModule } from './modules/feed/feed.module';
import { NetworkModule } from './modules/network/network.module';
import { ProfilesDomainModule } from './modules/profiles/profiles.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { AgencyModule } from './modules/agency/agency.module';
import { GroupsModule } from './modules/groups/groups.module';
import { EventsModule } from './modules/events/events.module';
import { TrustModule } from './modules/trust/trust.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { CallsModule } from './modules/calls/calls.module';
import { BookingModule } from './modules/booking/booking.module';
import { MediaViewerModule } from './modules/media-viewer/media-viewer.module';
import { PodcastsModule } from './modules/podcasts/podcasts.module';
import { JobsBrowseModule } from './modules/jobs-browse/jobs-browse.module';
import { WebinarsModule } from './modules/webinars/webinars.module';
import { JobPostingStudioModule } from './modules/job-posting-studio/job-posting-studio.module';
import { JobApplicationFlowModule } from './modules/job-application-flow/job-application-flow.module';
import { RecruiterJobManagementModule } from './modules/recruiter-job-management/recruiter-job-management.module';
import { InterviewPlanningModule } from './modules/interview-planning/interview-planning.module';
import { TalentSearchNavigatorModule } from './modules/talent-search-navigator/talent-search-navigator.module';
import { CandidatePipelineModule } from './modules/candidate-pipeline/candidate-pipeline.module';
import { OutboundWebhooksModule } from './modules/outbound-webhooks/outbound-webhooks.module';
import { EnterpriseHiringWorkspaceModule } from './modules/enterprise-hiring-workspace/enterprise-hiring-workspace.module';
import { CandidateAvailabilityMatchingModule } from './modules/candidate-availability-matching/candidate-availability-matching.module';
import { ProjectsBrowseDiscoveryModule } from './modules/projects-browse-discovery/projects-browse-discovery.module';
import { ProjectPostingSmartMatchModule } from './modules/project-posting-smart-match/project-posting-smart-match.module';
import { ProposalBuilderBidCreditsModule } from './modules/proposal-builder-bid-credits/proposal-builder-bid-credits.module';
import { ProposalReviewAwardModule } from './modules/proposal-review-award/proposal-review-award.module';
import { ContractsSowAcceptanceModule } from './modules/contracts-sow-acceptance/contracts-sow-acceptance.module';
import { ProjectWorkspacesHandoverModule } from './modules/project-workspaces-handover/project-workspaces-handover.module';
import { SellerPerformanceAvailabilityModule } from './modules/seller-performance-availability/seller-performance.module';
import { UserDashboardModule } from './modules/user-dashboard/user-dashboard.module';
import { ClientDashboardModule } from './modules/client-dashboard/client-dashboard.module';
import { RecruiterDashboardModule } from './modules/recruiter-dashboard/recruiter-dashboard.module';
import { AgencyManagementDashboardModule } from './modules/agency-management-dashboard/agency-management-dashboard.module';
import { EnterpriseDashboardModule } from './modules/enterprise-dashboard/enterprise-dashboard.module';
import { OrgMembersSeatsModule } from './modules/org-members-seats/org-members-seats.module';
import { SharedWorkspacesCollaborationModule } from './modules/shared-workspaces-collaboration/shared-workspaces-collaboration.module';
import { ResourcePlanningUtilizationModule } from './modules/resource-planning-utilization/resource-planning-utilization.module';
import { WalletCreditsPackagesModule } from './modules/wallet-credits-packages/wallet-credits-packages.module';
import { BillingInvoicesTaxModule } from './modules/billing-invoices-tax/billing-invoices-tax.module';
import { PayoutsEscrowFinopsModule } from './modules/payouts-escrow-finops/payouts-escrow-finops.module';
import { AdsManagerBuilderModule } from './modules/ads-manager-builder/ads-manager-builder.module';
import { AdsAnalyticsPerformanceModule } from './modules/ads-analytics-performance/ads-analytics-performance.module';
import { MapViewsGeoIntelModule } from './modules/map-views-geo-intel/map-views-geo-intel.module';
import { DonationsPurchasesCommerceModule } from './modules/donations-purchases-commerce/donations-purchases-commerce.module';
import { PricingPromotionsMonetizationModule } from './modules/pricing-promotions-monetization/pricing-promotions-monetization.module';
import { InternalAdminLoginTerminalModule } from './modules/internal-admin-login-terminal/internal-admin-login-terminal.module';
import { InternalAdminShellModule } from './modules/internal-admin-shell/internal-admin-shell.module';
import { CustomerServiceModule } from './modules/customer-service/customer-service.module';
import { FinanceAdminModule } from './modules/finance-admin/finance-admin.module';
import { DisputeOpsModule } from './modules/dispute-ops/dispute-ops.module';
import { ModeratorDashboardModule } from './modules/moderator-dashboard/moderator-dashboard.module';
import { TrustSafetyMlModule } from './modules/trust-safety-ml/trust-safety-ml.module';
import { MlPipelineModule } from './modules/ml-pipeline/ml-pipeline.module';
import { AdsOpsModule } from './modules/ads-ops/ads-ops.module';
import { VerificationComplianceModule } from './modules/verification-compliance/verification-compliance.module';
import { SuperAdminCommandCenterModule } from './modules/super-admin-command-center/super-admin-command-center.module';
import { AdminOpsModule } from './modules/admin-ops/admin-ops.module';
import { MasterSettingsModule } from './modules/master-settings/master-settings.module';
import { EnterpriseConnectModule } from './modules/enterprise-connect/enterprise-connect.module';
import { NetworkingEventsGroupsModule } from './modules/networking-events-groups/networking-events-groups.module';
import { SalesNavigatorModule } from './modules/sales-navigator/sales-navigator.module';
import { ExperienceLaunchpadModule } from './modules/experience-launchpad/experience-launchpad.module';
import { CreationStudioModule } from './modules/creation-studio/creation-studio.module';
import { TaskListModule } from './modules/task-list/task-list.module';
import { TeamManagementModule } from './modules/team-management/team-management.module';
import { DomainBusModule } from './modules/domain-bus/domain-bus.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { CrossDomainBootModule } from './modules/domain-bus/cross-domain-boot.module';
import { InfraGlobalModule } from './infra/infra-global.module';
import { MlBridgeModule } from './infra/ml-bridge.module';
import { QueuesModule } from './infra/queues/queues.module';
import { KpiRegistryModule } from './modules/kpi-registry/kpi-registry.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import {
  UsersModule, ProfilesModule, JobsModule, ProjectsModule, GigsModule,
  ServicesModule, OrdersModule, BillingModule,
  MessagingModule, MediaModule, AdminModule,
} from './modules/_stub.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
    }),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    }),
    InfraGlobalModule,
    MlBridgeModule,
    QueuesModule,
    KpiRegistryModule, ReportingModule,
    AuthModule, IdentityModule, EntitlementsModule, SearchModule, OverlaysModule, SettingsModule, FeedModule, NetworkModule, ProfilesDomainModule, CompaniesModule, AgencyModule, GroupsModule, EventsModule, TrustModule, InboxModule, CallsModule, BookingModule, MediaViewerModule, PodcastsModule, JobsBrowseModule, WebinarsModule, JobPostingStudioModule, JobApplicationFlowModule, RecruiterJobManagementModule, TalentSearchNavigatorModule, CandidatePipelineModule, InterviewPlanningModule, EnterpriseHiringWorkspaceModule, CandidateAvailabilityMatchingModule, ProjectsBrowseDiscoveryModule, ProjectPostingSmartMatchModule, ProposalBuilderBidCreditsModule, ProposalReviewAwardModule, ContractsSowAcceptanceModule, ProjectWorkspacesHandoverModule, SellerPerformanceAvailabilityModule, OutboundWebhooksModule, DomainBusModule, IntegrationsModule, CrossDomainBootModule, WorkspaceModule, MarketingModule, UserDashboardModule, ClientDashboardModule, RecruiterDashboardModule, AgencyManagementDashboardModule, EnterpriseDashboardModule, OrgMembersSeatsModule, SharedWorkspacesCollaborationModule, ResourcePlanningUtilizationModule, WalletCreditsPackagesModule, BillingInvoicesTaxModule, PayoutsEscrowFinopsModule, AdsManagerBuilderModule, AdsAnalyticsPerformanceModule, MapViewsGeoIntelModule, DonationsPurchasesCommerceModule, PricingPromotionsMonetizationModule, InternalAdminLoginTerminalModule, InternalAdminShellModule, EnterpriseConnectModule, CustomerServiceModule, FinanceAdminModule, DisputeOpsModule, ModeratorDashboardModule, TrustSafetyMlModule, MlPipelineModule, AdsOpsModule, VerificationComplianceModule, SuperAdminCommandCenterModule, MasterSettingsModule, AdminOpsModule, NetworkingEventsGroupsModule, SalesNavigatorModule, ExperienceLaunchpadModule, CreationStudioModule, TaskListModule, TeamManagementModule, UsersModule, ProfilesModule,
    JobsModule, ProjectsModule, GigsModule, ServicesModule, OrdersModule,
    BillingModule, NotificationsModule, MessagingModule, MediaModule,
    AdminModule, HealthModule,
  ],
})
export class AppModule {}
