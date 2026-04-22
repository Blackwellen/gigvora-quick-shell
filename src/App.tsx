import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

import { PublicShell } from "@/components/layout/PublicShell";
import { LoggedInShell } from "@/components/layout/LoggedInShell";
import { DashboardShell } from "@/components/layout/DashboardShell";

import LandingPage from "@/pages/LandingPage";
import StatusPage from "@/pages/StatusPage";
import AboutPage from "@/pages/AboutPage";
import PricingPage from "@/pages/PricingPage";
import FAQPage from "@/pages/FAQPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import UserAgreementsPage from "@/pages/UserAgreementsPage";
import TrustSafetyPage from "@/pages/TrustSafetyPage";
import DisputesPolicyPage from "@/pages/legal/DisputesPolicyPage";
import PaymentsEscrowPolicyPage from "@/pages/legal/PaymentsEscrowPolicyPage";
import AdvertisingPolicyPage from "@/pages/legal/AdvertisingPolicyPage";
import CreatorMonetizationPolicyPage from "@/pages/legal/CreatorMonetizationPolicyPage";
import CommunityGuidelinesPage from "@/pages/legal/CommunityGuidelinesPage";
import AppealsPolicyPage from "@/pages/legal/AppealsPolicyPage";
import SupportPage from "@/pages/SupportPage";
import ContactPage from "@/pages/ContactPage";
import ProductPage from "@/pages/ProductPage";
import SolutionsPage from "@/pages/SolutionsPage";
import ShowcaseJobsPage from "@/pages/showcase/ShowcaseJobsPage";
import ShowcaseGigsPage from "@/pages/showcase/ShowcaseGigsPage";
import ShowcaseProjectsPage from "@/pages/showcase/ShowcaseProjectsPage";
import ShowcaseServicesPage from "@/pages/showcase/ShowcaseServicesPage";
import ShowcaseRecruiterPage from "@/pages/showcase/ShowcaseRecruiterPage";
import ShowcaseNavigatorPage from "@/pages/showcase/ShowcaseNavigatorPage";
import ShowcaseEnterprisePage from "@/pages/showcase/ShowcaseEnterprisePage";
import ShowcaseAdsPage from "@/pages/showcase/ShowcaseAdsPage";
import ShowcaseNetworkingPage from "@/pages/showcase/ShowcaseNetworkingPage";
import ShowcaseEventsPage from "@/pages/showcase/ShowcaseEventsPage";
import ShowcasePodcastsPage from "@/pages/showcase/ShowcasePodcastsPage";
import ShowcaseMentorshipPage from "@/pages/showcase/ShowcaseMentorshipPage";
import ShowcaseCreatorPage from "@/pages/showcase/ShowcaseCreatorPage";
import ShowcaseLaunchpadPage from "@/pages/showcase/ShowcaseLaunchpadPage";
import SignInPage from "@/pages/auth/SignInPage";
import SignUpPage from "@/pages/auth/SignUpPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyPage from "@/pages/auth/VerifyPage";
import OnboardingPage from "@/pages/auth/OnboardingPage";
import AccountLockedPage from "@/pages/auth/AccountLockedPage";
import FeedPage from "@/pages/FeedPage";
import ProfilePage from "@/pages/ProfilePage";
import ProfileActivityPage from "@/pages/profile/ProfileActivityPage";
import ProfileServicesTab from "@/pages/profile/ProfileServicesTab";
import ProfileGigsTab from "@/pages/profile/ProfileGigsTab";
import ProfileProjectsTab from "@/pages/profile/ProfileProjectsTab";
import ProfileReviewsTab from "@/pages/profile/ProfileReviewsTab";
import ProfileMediaTab from "@/pages/profile/ProfileMediaTab";
import ProfileEventsTab from "@/pages/profile/ProfileEventsTab";
import ProfileNetworkTab from "@/pages/profile/ProfileNetworkTab";
import CreatorProfilePage from "@/pages/profile/CreatorProfilePage";
import PageAnalyticsPage from "@/pages/profile/PageAnalyticsPage";
import PageAdminControlsPage from "@/pages/profile/PageAdminControlsPage";
import UserDashboardPage from "@/pages/dashboard/UserDashboardPage";
import ProfessionalDashboardPage from "@/pages/dashboard/ProfessionalDashboardPage";
import ClientDashboardPage from "@/pages/dashboard/ClientDashboardPage";
import RecruiterDashboardPage from "@/pages/dashboard/RecruiterDashboardPage";
import DashboardActivityPage from "@/pages/dashboard/DashboardActivityPage";
import DashboardSavedPage from "@/pages/dashboard/DashboardSavedPage";
import DashboardOrdersPage from "@/pages/dashboard/DashboardOrdersPage";
import DashboardProjectsPage from "@/pages/dashboard/DashboardProjectsPage";
import DashboardApplicationsPage from "@/pages/dashboard/DashboardApplicationsPage";
import DashboardBookingsPage from "@/pages/dashboard/DashboardBookingsPage";
import DashboardMediaLibraryPage from "@/pages/dashboard/DashboardMediaLibraryPage";
import DashboardBillingPage from "@/pages/dashboard/DashboardBillingPage";
import DashboardSupportPage from "@/pages/dashboard/DashboardSupportPage";
import DashboardSettingsPage from "@/pages/dashboard/DashboardSettingsPage";
import ProWorkQueuePage from "@/pages/dashboard/professional/ProWorkQueuePage";
import ProGigsServicesPage from "@/pages/dashboard/professional/ProGigsServicesPage";
import ProOrdersPage from "@/pages/dashboard/professional/ProOrdersPage";
import ProProjectsProposalsPage from "@/pages/dashboard/professional/ProProjectsProposalsPage";
import ProBookingsPage from "@/pages/dashboard/professional/ProBookingsPage";
import ProEarningsPage from "@/pages/dashboard/professional/ProEarningsPage";
import ProPerformancePage from "@/pages/dashboard/professional/ProPerformancePage";
import ProAnalyticsPage from "@/pages/dashboard/professional/ProAnalyticsPage";
import ProContentMediaPage from "@/pages/dashboard/professional/ProContentMediaPage";
import ProCreditsBillingPage from "@/pages/dashboard/professional/ProCreditsBillingPage";
import ProSettingsPage from "@/pages/dashboard/professional/ProSettingsPage";
import EntHiringOpsPage from "@/pages/dashboard/enterprise/EntHiringOpsPage";
import EntProjectsProcurementPage from "@/pages/dashboard/enterprise/EntProjectsProcurementPage";
import EntVendorsServicesPage from "@/pages/dashboard/enterprise/EntVendorsServicesPage";
import EntCampaignsGrowthPage from "@/pages/dashboard/enterprise/EntCampaignsGrowthPage";
import EntSpendApprovalsPage from "@/pages/dashboard/enterprise/EntSpendApprovalsPage";
import EntTeamActivityPage from "@/pages/dashboard/enterprise/EntTeamActivityPage";
import EntEnterpriseConnectPage from "@/pages/dashboard/enterprise/EntEnterpriseConnectPage";
import EntSupportRiskPage from "@/pages/dashboard/enterprise/EntSupportRiskPage";
import EntSettingsSeatsPage from "@/pages/dashboard/enterprise/EntSettingsSeatsPage";
import NetworkingPage from "@/pages/networking/NetworkingPage";
import SpeedNetworkingLobbyPage from "@/pages/networking/SpeedNetworkingLobbyPage";
import NetworkingSessionsPage from "@/pages/networking/NetworkingSessionsPage";
import NetworkingHomePage from "@/pages/networking/NetworkingHomePage";
import ConnectionsHubPage from "@/pages/networking/ConnectionsHubPage";
import FollowersHubPage from "@/pages/networking/FollowersHubPage";
import SuggestedConnectionsPage from "@/pages/networking/SuggestedConnectionsPage";
import NetworkingRoomsLobbyPage from "@/pages/networking/NetworkingRoomsLobbyPage";
import LiveNetworkingRoomPage from "@/pages/networking/LiveNetworkingRoomPage";
import LiveSpeedNetworkingPage from "@/pages/networking/LiveSpeedNetworkingPage";
import FollowingHubPage from "@/pages/networking/FollowingHubPage";
import IntroductionsPage from "@/pages/networking/IntroductionsPage";
import PostSessionFollowUpPage from "@/pages/networking/PostSessionFollowUpPage";
import NetworkingAnalyticsPage from "@/pages/networking/NetworkingAnalyticsPage";
import DigitalCardGalleryPage from "@/pages/networking/DigitalCardGalleryPage";
import FollowUpCenterPage from "@/pages/networking/FollowUpCenterPage";
import CollaborationSuggestionsPage from "@/pages/networking/CollaborationSuggestionsPage";
import PendingInvitationsPage from "@/pages/networking/PendingInvitationsPage";
import RoomCreationWizardPage from "@/pages/networking/RoomCreationWizardPage";
import HostConsolePage from "@/pages/networking/HostConsolePage";
import SessionAnalyticsPage from "@/pages/networking/SessionAnalyticsPage";
import EventsDiscoveryPage from "@/pages/events/EventsDiscoveryPage";
import EventDetailPage from "@/pages/events/EventDetailPage";
import EventCreatePage from "@/pages/events/EventCreatePage";
import EventRSVPPage from "@/pages/events/EventRSVPPage";
import EventLobbyPage from "@/pages/events/EventLobbyPage";
import EventLiveRoomPage from "@/pages/events/EventLiveRoomPage";
import EventHostControlsPage from "@/pages/events/EventHostControlsPage";
import EventAttendeeManagementPage from "@/pages/events/EventAttendeeManagementPage";
import EventReplayPage from "@/pages/events/EventReplayPage";
import EventAnalyticsPage from "@/pages/events/EventAnalyticsPage";
import GroupsHubPage from "@/pages/groups/GroupsHubPage";
import GroupDetailPage from "@/pages/groups/GroupDetailPage";
import GroupFeedPage from "@/pages/groups/GroupFeedPage";
import GroupMembersPage from "@/pages/groups/GroupMembersPage";
import GroupFilesPage from "@/pages/groups/GroupFilesPage";
import GroupEventsPage from "@/pages/groups/GroupEventsPage";
import GroupModerationPage from "@/pages/groups/GroupModerationPage";
import GroupJoinApprovalPage from "@/pages/groups/GroupJoinApprovalPage";
import GroupAnalyticsPage from "@/pages/groups/GroupAnalyticsPage";
import InboxPage from "@/pages/InboxPage";
import JobsBrowsePage from "@/pages/jobs/JobsPages";
import JobDetailPage from "@/pages/jobs/JobDetailPage";
import JobCreatePage from "@/pages/jobs/JobCreatePage";
import ApplicationTrackerPage from "@/pages/jobs/ApplicationTrackerPage";
import JobWorkspacePage from "@/pages/jobs/JobWorkspacePage";
import JobDistributionPage from "@/pages/jobs/JobDistributionPage";
import JobApplicantsCenterPage from "@/pages/jobs/JobApplicantsCenterPage";
import JobScreeningPage from "@/pages/jobs/JobScreeningPage";
import HiringTeamPage from "@/pages/jobs/HiringTeamPage";
import JobAnalyticsPage from "@/pages/jobs/JobAnalyticsPage";
import JobArchivePage from "@/pages/jobs/JobArchivePage";
import RecruiterJobsPage from "@/pages/recruiter/RecruiterJobsPage";
import RecruiterTalentSearchPage from "@/pages/recruiter/RecruiterTalentSearchPage";
import RecruiterInterviewsPage from "@/pages/recruiter/RecruiterInterviewsPage";
import RecruiterOffersPage from "@/pages/recruiter/RecruiterOffersPage";
import RecruiterJobWorkspacePage from "@/pages/recruiter/RecruiterJobWorkspacePage";
import RecruiterCandidateSearchPage from "@/pages/recruiter/RecruiterCandidateSearchPage";
import RecruiterMatchCenterPage from "@/pages/recruiter/RecruiterMatchCenterPage";
import RecruiterOutreachPage from "@/pages/recruiter/RecruiterOutreachPage";
import RecruiterAnalyticsPage from "@/pages/recruiter/RecruiterAnalyticsPage";
import RecruiterBillingPage from "@/pages/recruiter/RecruiterBillingPage";
import RecruiterOutreachTemplatesPage from "@/pages/recruiter/RecruiterOutreachTemplatesPage";
import RecruiterCandidateNotesPage from "@/pages/recruiter/RecruiterCandidateNotesPage";
import RecruiterSeatsPage from "@/pages/recruiter/RecruiterSeatsPage";
import HireCommandCenter from "@/pages/hire/HireCommandCenter";
import HireScorecardsPage from "@/pages/hire/HireScorecardsPage";
import HireTalentPoolsPage from "@/pages/hire/HireTalentPoolsPage";
import HireTeamPage from "@/pages/hire/HireTeamPage";
import HireSettingsPage from "@/pages/hire/HireSettingsPage";
import HireJobCreatePage from "@/pages/hire/HireJobCreatePage";
import { HirePageWrapper } from "@/components/shell/HirePageWrapper";
import GigDetailPage from "@/pages/gigs/GigDetailPage";
import GigsDiscoveryPage from "@/pages/gigs/GigsDiscoveryPage";
import GigOrderPage from "@/pages/gigs/GigOrderPage";
import GigCreatePage from "@/pages/gigs/GigCreatePage";
import SellerPerformancePage from "@/pages/gigs/SellerPerformancePage";
import GigWorkspaceHomePage from "@/pages/gigs/GigWorkspaceHomePage";
import GigPackagesBuilderPage from "@/pages/gigs/GigPackagesBuilderPage";
import GigRequirementsBuilderPage from "@/pages/gigs/GigRequirementsBuilderPage";
import GigAnalyticsPage from "@/pages/gigs/GigAnalyticsPage";
import GigOrdersCenterPage from "@/pages/gigs/GigOrdersCenterPage";
import GigPricingIntelPage from "@/pages/gigs/GigPricingIntelPage";
import CustomOffersPage from "@/pages/gigs/CustomOffersPage";
import RevisionManagementPage from "@/pages/gigs/RevisionManagementPage";
import SellerAvailabilityPage from "@/pages/gigs/SellerAvailabilityPage";
import GigAddonsBuilderPage from "@/pages/gigs/GigAddonsBuilderPage";
import GigMediaManagerPage from "@/pages/gigs/GigMediaManagerPage";
import GigPromotionsPage from "@/pages/gigs/GigPromotionsPage";
import GigArchivePage from "@/pages/gigs/GigArchivePage";
import OffersPage from "@/pages/offers/OffersPage";
import OrdersDashboard from "@/pages/orders/OrdersDashboardPage";
import WorkHubPage from "@/pages/work/WorkHubPage";
import ServiceDetailPage from "@/pages/services/ServiceDetailPage";
import ServiceListingBuilderPage from "@/pages/services/ServiceListingBuilderPage";
import ServiceOrdersPage from "@/pages/services/ServiceOrdersPage";
import ProjectsBrowsePage from "@/pages/projects/ProjectsBrowsePage";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
import ProjectCreatePage from "@/pages/projects/ProjectCreatePage";
import MyProjectsPage from "@/pages/projects/MyProjectsPage";
import ProposalSubmissionPage from "@/pages/projects/ProposalSubmissionPage";
import ProposalReviewAwardPage from "@/pages/projects/ProposalReviewAwardPage";
import ProjectWorkspacePage from "@/pages/projects/ProjectWorkspacePage";
import TaskBoardPage from "@/pages/projects/TaskBoardPage";
import ProjectTaskTablePage from "@/pages/projects/ProjectTaskTablePage";
import ProjectTimelinePage from "@/pages/projects/ProjectTimelinePage";
import ProjectFilesPage from "@/pages/projects/ProjectFilesPage";
import ProjectApprovalsPage from "@/pages/projects/ProjectApprovalsPage";
import ProjectTemplatesPage from "@/pages/projects/ProjectTemplatesPage";
import ProjectRiskBlockersPage from "@/pages/projects/ProjectRiskBlockersPage";
import ProjectEscrowPage from "@/pages/projects/ProjectEscrowPage";
import ProjectMilestonesPage from "@/pages/projects/ProjectMilestonesPage";
import ProjectDashboardPage from "@/pages/projects/ProjectDashboardPage";
import ProjectDeliverablesPage from "@/pages/projects/ProjectDeliverablesPage";
import ProjectArchivePage from "@/pages/projects/ProjectArchivePage";
import JobTemplatesPage from "@/pages/jobs/JobTemplatesPage";
import RecruiterProPage from "@/pages/recruiter/RecruiterProPage";
import RecruiterManagementPage from "@/pages/recruiter/RecruiterManagementPage";
import RecruiterPipelinePage from "@/pages/recruiter/RecruiterPipelinePage";
import SalesNavigatorPage from "@/pages/sales/SalesNavigatorPage";
import NavigatorLeadsPage from "@/pages/sales/NavigatorLeadsPage";
import NavigatorTalentPage from "@/pages/sales/NavigatorTalentPage";
import NavigatorAccountsPage from "@/pages/sales/NavigatorAccountsPage";
import NavigatorCompanyIntelPage from "@/pages/sales/NavigatorCompanyIntelPage";
import NavigatorOutreachPage from "@/pages/sales/NavigatorOutreachPage";
import NavigatorGraphPage from "@/pages/sales/NavigatorGraphPage";
import NavigatorGeoPage from "@/pages/sales/NavigatorGeoPage";
import NavigatorSignalsPage from "@/pages/sales/NavigatorSignalsPage";
import NavigatorAnalyticsPage from "@/pages/sales/NavigatorAnalyticsPage";
import NavigatorSavedListsPage from "@/pages/sales/NavigatorSavedListsPage";
import NavigatorSmartListsPage from "@/pages/sales/NavigatorSmartListsPage";
import NavigatorSeatsPage from "@/pages/sales/NavigatorSeatsPage";
import NavigatorSavedTalentListsPage from "@/pages/sales/NavigatorSavedTalentListsPage";
import NavigatorOutreachTemplatesPage from "@/pages/sales/NavigatorOutreachTemplatesPage";
import NavigatorHiringSignalsPage from "@/pages/sales/NavigatorHiringSignalsPage";
import NavigatorEngagementSignalsPage from "@/pages/sales/NavigatorEngagementSignalsPage";
import NavigatorSettingsPage from "@/pages/sales/NavigatorSettingsPage";
import AdsManagerPage from "@/pages/ads/AdsManagerPage";
import AdsHomePage from "@/pages/ads/AdsHomePage";
import AdsCampaignListPage from "@/pages/ads/AdsCampaignListPage";
import AdsCampaignDetailPage from "@/pages/ads/AdsCampaignDetailPage";
import AdsAdSetBuilderPage from "@/pages/ads/AdsAdSetBuilderPage";
import AdsCreativeBuilderPage from "@/pages/ads/AdsCreativeBuilderPage";
import AdsAssetLibraryPage from "@/pages/ads/AdsAssetLibraryPage";
import AdsAudienceBuilderPage from "@/pages/ads/AdsAudienceBuilderPage";
import AdsKeywordBuilderPage from "@/pages/ads/AdsKeywordBuilderPage";
import AdsGeoTargetingPage from "@/pages/ads/AdsGeoTargetingPage";
import AdsForecastingPage from "@/pages/ads/AdsForecastingPage";
import AdsBidBudgetPage from "@/pages/ads/AdsBidBudgetPage";
import AdsBillingPage from "@/pages/ads/AdsBillingPage";
import AdsCreativeComparePage from "@/pages/ads/AdsCreativeComparePage";
import AdsAttributionPage from "@/pages/ads/AdsAttributionPage";
import AdsSavedAudiencesPage from "@/pages/ads/AdsSavedAudiencesPage";
import AdsPlacementManagerPage from "@/pages/ads/AdsPlacementManagerPage";
import AdsAudienceInsightsPage from "@/pages/ads/AdsAudienceInsightsPage";
import AdsCreativePerformancePage from "@/pages/ads/AdsCreativePerformancePage";
import AdsPolicyReviewPage from "@/pages/ads/AdsPolicyReviewPage";
import LaunchpadPage from "@/pages/launchpad/LaunchpadPage";
import VolunteeringPage from "@/pages/volunteering/VolunteeringPage";
import AdsAnalyticsPage from "@/pages/ads/AdsAnalyticsPage";
import MapGeoIntelPage from "@/pages/geo/MapGeoIntelPage";
import EnterpriseConnectPage from "@/pages/enterprise/EnterpriseConnectPage";
import EnterpriseConnectHomePage from "@/pages/enterprise/EnterpriseConnectHomePage";
import EnterpriseDirectoryPage from "@/pages/enterprise/EnterpriseDirectoryPage";
import EnterpriseProfilePage from "@/pages/enterprise/EnterpriseProfilePage";
import EnterprisePartnerDiscoveryPage from "@/pages/enterprise/EnterprisePartnerDiscoveryPage";
import EnterpriseProcurementPage from "@/pages/enterprise/EnterpriseProcurementPage";
import EnterpriseIntrosPage from "@/pages/enterprise/EnterpriseIntrosPage";
import EnterpriseEventsPage from "@/pages/enterprise/EnterpriseEventsPage";
import EnterpriseRoomsPage from "@/pages/enterprise/EnterpriseRoomsPage";
import EnterpriseAnalyticsPage from "@/pages/enterprise/EnterpriseAnalyticsPage";
import EnterpriseSavedListsPage from "@/pages/enterprise/EnterpriseSavedListsPage";
import EnterpriseHiringWorkspacePage from "@/pages/enterprise/EnterpriseHiringWorkspacePage";
import EnterpriseMatchmakingPage from "@/pages/enterprise/EnterpriseMatchmakingPage";
import EnterpriseActivitySignalsPage from "@/pages/enterprise/EnterpriseActivitySignalsPage";
import EnterpriseConnectSettingsPage from "@/pages/enterprise/EnterpriseConnectSettingsPage";
import CandidateAvailabilityPage from "@/pages/jobs/CandidateAvailabilityPage";
import FinanceHubPage from "@/pages/finance/FinanceHubPage";
import { GroupsPage, EventsPage } from "@/pages/community/CommunityPages";
import CommunityGroupsPage from "@/pages/community/CommunityGroupsPage";
import InteractiveMediaPage from "@/pages/interactive/InteractiveMediaPage";
import CreationStudioPage from "@/pages/community/CreationStudioPage";
import StudioDraftsPage from "@/pages/creation-studio/StudioDraftsPage";
import ScheduledContentPage from "@/pages/creation-studio/ScheduledContentPage";
import AssetLibraryPage from "@/pages/creation-studio/AssetLibraryPage";
import ReelBuilderPage from "@/pages/creation-studio/ReelBuilderPage";
import StudioAnalyticsPage from "@/pages/creation-studio/StudioAnalyticsPage";
import PublishReviewPage from "@/pages/creation-studio/PublishReviewPage";
import CalendarPage from "@/pages/CalendarPage";
import BookingsListPage from "@/pages/calendar/BookingsListPage";
import AvailabilitySettingsPage from "@/pages/calendar/AvailabilitySettingsPage";
import BookingWizardPage from "@/pages/calendar/BookingWizardPage";
import DonationFlowPage from "@/pages/calendar/DonationFlowPage";
import LaunchpadProgressTrackerPage from "@/pages/launchpad/LaunchpadProgressTrackerPage";
import CallsVideoPage from "@/pages/calls/CallsVideoPage";
import MediaViewerPage from "@/pages/media/MediaViewerPage";
import MediaHomePage from "@/pages/media/MediaHomePage";
import ReelsOverlayPage from "@/pages/media/ReelsOverlayPage";
import VideoDiscoveryPage from "@/pages/media/VideoDiscoveryPage";
import VideoPlayerDetailPage from "@/pages/media/VideoPlayerDetailPage";
import MediaLibraryPage from "@/pages/media/MediaLibraryPage";
import VideoUploadStudioPage from "@/pages/media/VideoUploadStudioPage";
import VideoStudioPage from "@/pages/media/VideoStudioPage";
import ReelsDiscoveryPage from "@/pages/media/ReelsDiscoveryPage";
import ReelsEditingStudioPage from "@/pages/media/ReelsEditingStudioPage";
import CreatorDiscoveryPage from "@/pages/media/CreatorDiscoveryPage";
import MediaAnalyticsPage from "@/pages/media/MediaAnalyticsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import SupportCenterPage from "@/pages/support/SupportCenterPage";
import AdminPage from "@/pages/admin/AdminPage";
import AdminOpsPage from "@/pages/admin/AdminOpsPage";
import FinanceAdminPage from "@/pages/admin/FinanceAdminPage";
import SuperAdminPage from "@/pages/admin/SuperAdminPage";
import { AdminAuthProvider } from "@/lib/adminAuth";
import { AdminGuard } from "@/components/layout/AdminGuard";
import AdminPortalLandingPage from "@/pages/admin/AdminPortalLandingPage";
import MarketingAdminLandingPage from "@/pages/admin/marketing/MarketingAdminLandingPage";
import AdsModerationPage from "@/pages/admin/marketing/AdsModerationPage";
import CampaignsPage from "@/pages/admin/marketing/CampaignsPage";
import TrafficAnalyticsPage from "@/pages/admin/marketing/TrafficAnalyticsPage";
import SeoToolsPage from "@/pages/admin/marketing/SeoToolsPage";
import IpAnalysisPage from "@/pages/admin/marketing/IpAnalysisPage";
import LocationAnalysisPage from "@/pages/admin/marketing/LocationAnalysisPage";
import MarketingInboxPage from "@/pages/admin/marketing/MarketingInboxPage";
import MarketingEmailsPage from "@/pages/admin/marketing/MarketingEmailsPage";
import MarketingTasksPage from "@/pages/admin/marketing/MarketingTasksPage";
import MarketingNoticesPage from "@/pages/admin/marketing/MarketingNoticesPage";
// AD-018 Customer Service Admin Portal
import CustomerServiceLandingPage from "@/pages/admin/customer-service/CustomerServiceLandingPage";
import CsTicketsPage from "@/pages/admin/customer-service/CsTicketsPage";
import CsTicketDetailPage from "@/pages/admin/customer-service/CsTicketDetailPage";
import CsEscalationsPage from "@/pages/admin/customer-service/CsEscalationsPage";
import CsTasksPage from "@/pages/admin/customer-service/CsTasksPage";
import CsInternalChatPage from "@/pages/admin/customer-service/CsInternalChatPage";
import CsCustomerChatPage from "@/pages/admin/customer-service/CsCustomerChatPage";
import CsEmailsPage from "@/pages/admin/customer-service/CsEmailsPage";
import CsNotesPage from "@/pages/admin/customer-service/CsNotesPage";
import CsNoticesPage from "@/pages/admin/customer-service/CsNoticesPage";
import CsNotificationsPage from "@/pages/admin/customer-service/CsNotificationsPage";
import CsAnalyticsPage from "@/pages/admin/customer-service/CsAnalyticsPage";
import CsKpiCardsPage from "@/pages/admin/customer-service/CsKpiCardsPage";
// AD-019 Finance Admin Portal
import FinanceLandingPage from "@/pages/admin/finance/FinanceLandingPage";
import FinTicketsPage from "@/pages/admin/finance/FinTicketsPage";
import FinTasksPage from "@/pages/admin/finance/FinTasksPage";
import FinInternalChatPage from "@/pages/admin/finance/FinInternalChatPage";
import FinCustomerChatPage from "@/pages/admin/finance/FinCustomerChatPage";
import FinEmailsPage from "@/pages/admin/finance/FinEmailsPage";
import FinNoticesPage from "@/pages/admin/finance/FinNoticesPage";
import FinNotificationsPage from "@/pages/admin/finance/FinNotificationsPage";
import FinTransactionsPage from "@/pages/admin/finance/FinTransactionsPage";
import FinEscrowPage from "@/pages/admin/finance/FinEscrowPage";
import FinRecordsPage from "@/pages/admin/finance/FinRecordsPage";
import FinSubscriptionsPage from "@/pages/admin/finance/FinSubscriptionsPage";
import FinCreditsPage from "@/pages/admin/finance/FinCreditsPage";
import FinEarningsPage from "@/pages/admin/finance/FinEarningsPage";
import FinCommissionsPage from "@/pages/admin/finance/FinCommissionsPage";
import FinAdSpendPage from "@/pages/admin/finance/FinAdSpendPage";
import FinBankDetailsPage from "@/pages/admin/finance/FinBankDetailsPage";
import FinAnalyticsPage from "@/pages/admin/finance/FinAnalyticsPage";
import FinKpiCardsPage from "@/pages/admin/finance/FinKpiCardsPage";
// AD-020 Moderator & Trust Review Portal
import ModerationLandingPage from "@/pages/admin/moderation/ModerationLandingPage";
import ModTicketsPage from "@/pages/admin/moderation/ModTicketsPage";
import ModTasksPage from "@/pages/admin/moderation/ModTasksPage";
import ModInternalChatPage from "@/pages/admin/moderation/ModInternalChatPage";
import ModCustomerChatPage from "@/pages/admin/moderation/ModCustomerChatPage";
import ModEmailsPage from "@/pages/admin/moderation/ModEmailsPage";
import ModNoticesPage from "@/pages/admin/moderation/ModNoticesPage";
import ModNotificationsPage from "@/pages/admin/moderation/ModNotificationsPage";
import ModLiveFeedPage from "@/pages/admin/moderation/ModLiveFeedPage";
import ModChatsPage from "@/pages/admin/moderation/ModChatsPage";
import ModCommunicationsPage from "@/pages/admin/moderation/ModCommunicationsPage";
import ModVideoCommentsPage from "@/pages/admin/moderation/ModVideoCommentsPage";
import ModDocumentsPage from "@/pages/admin/moderation/ModDocumentsPage";
import ModAdsPage from "@/pages/admin/moderation/ModAdsPage";
import ModCompaniesPage from "@/pages/admin/moderation/ModCompaniesPage";
import ModUsersPage from "@/pages/admin/moderation/ModUsersPage";
import ModTrustPage from "@/pages/admin/moderation/ModTrustPage";
import ModAnalyticsPage from "@/pages/admin/moderation/ModAnalyticsPage";
import ModKpiCardsPage from "@/pages/admin/moderation/ModKpiCardsPage";
// AD-022 Super Admin Governance
import SuperAdminLandingPage from "@/pages/admin/super/SuperAdminLandingPage";
import SuperKpisPage from "@/pages/admin/super/SuperKpisPage";
import SuperFlagsPage from "@/pages/admin/super/SuperFlagsPage";
import SuperAdminsPage from "@/pages/admin/super/SuperAdminsPage";
import SuperEntitlementsPage from "@/pages/admin/super/SuperEntitlementsPage";
import SuperSettingsPage from "@/pages/admin/super/SuperSettingsPage";
import SuperEmergencyPage from "@/pages/admin/super/SuperEmergencyPage";
import SuperAuditPage from "@/pages/admin/super/SuperAuditPage";
import SuperSystemPage from "@/pages/admin/super/SuperSystemPage";
import MentorMarketplacePage from "@/pages/mentorship/MentorMarketplacePage";
import MentorProfilePage from "@/pages/mentorship/MentorProfilePage";
import MentorBookingPage from "@/pages/mentorship/MentorBookingPage";
import MentorFeedbackPage from "@/pages/mentorship/MentorFeedbackPage";
import MentorAnalyticsPage from "@/pages/mentorship/MentorAnalyticsPage";
import MentorPaymentsPage from "@/pages/mentorship/MentorPaymentsPage";
import DocumentStudioPage from "@/pages/documents/DocumentStudioPage";
import ExplorerPage from "@/pages/explore/ExplorerPage";
import PeopleSearchPage from "@/pages/explore/PeopleSearchPage";
import JobsSearchPage from "@/pages/explore/JobsSearchPage";
import ProjectsSearchPage from "@/pages/explore/ProjectsSearchPage";
import GigsSearchPage from "@/pages/explore/GigsSearchPage";
import ServicesSearchPage from "@/pages/explore/ServicesSearchPage";
import EventsSearchPage from "@/pages/explore/EventsSearchPage";
import GroupsSearchPage from "@/pages/explore/GroupsSearchPage";
import PodcastsSearchPage from "@/pages/explore/PodcastsSearchPage";
import WebinarsSearchPage from "@/pages/explore/WebinarsSearchPage";
import PagesSearchPage from "@/pages/explore/PagesSearchPage";
import SavedSearchesPage from "@/pages/explore/SavedSearchesPage";
import SearchMapViewPage from "@/pages/explore/SearchMapViewPage";
import SearchComparePreviewPage from "@/pages/explore/SearchComparePreviewPage";
import SavedItemsPage from "@/pages/saved/SavedItemsPage";
import HelpCategoryPage from "@/pages/support/HelpCategoryPage";
import HelpArticleDetailPage from "@/pages/support/HelpArticleDetailPage";
import TicketSubmissionPage from "@/pages/support/TicketSubmissionPage";
import MyTicketsPage from "@/pages/support/MyTicketsPage";
import TicketDetailPage from "@/pages/support/TicketDetailPage";
import EscalationsPage from "@/pages/support/EscalationsPage";
import SupportSearchPage from "@/pages/support/SupportSearchPage";
import PostComposerPage from "@/pages/create/PostComposerPage";
import WebsiteSettingsPage from "@/pages/settings/WebsiteSettingsPage";
import IntegrationsSettingsPage from "@/pages/settings/IntegrationsSettingsPage";
import GlobalAnalyticsPage from "@/pages/analytics/GlobalAnalyticsPage";
import PurchasesPage from "@/pages/purchases/PurchasesPage";
import DonationsPage from "@/pages/donations/DonationsPage";
import PagesManagementPage from "@/pages/pages/PagesManagementPage";
import SettingsPage from "@/pages/settings/SettingsPage";
import CompanyPage from "@/pages/company/CompanyPage";
import AgencyPage from "@/pages/agency/AgencyPage";
import AgencyManagementDashboardPage from "@/pages/agency/AgencyManagementDashboardPage";
import EnterpriseDashboardPage from "@/pages/enterprise/EnterpriseDashboardPage";
import OrgWorkspacePage from "@/pages/org/OrgWorkspacePage";
import OrgMembersSeatsPage from "@/pages/org/OrgMembersSeatsPage";
import SharedWorkspacesPage from "@/pages/org/SharedWorkspacesPage";
import ResourcePlanningPage from "@/pages/dashboard/ResourcePlanningPage";
import TrustPage from "@/pages/trust/TrustPage";
import ContractsPage from "@/pages/contracts/ContractsPage";
import ContractsSOWPage from "@/pages/contracts/ContractsSOWPage";
import MilestonesPage from "@/pages/contracts/MilestonesPage";
import EscrowPage from "@/pages/contracts/EscrowPage";
import ServicesMarketplacePage from "@/pages/services/ServicesMarketplacePage";
import DisputesPage from "@/pages/disputes/DisputesPage";
import WalletPage from "@/pages/finance/WalletPage";
import BillingPage from "@/pages/finance/BillingPage";
import InvoicesPage from "@/pages/finance/InvoicesPage";
import PayoutsPage from "@/pages/finance/PayoutsPage";
import CommercePatronagePage from "@/pages/finance/CommercePatronagePage";
import PricingMonetizationPage from "@/pages/finance/PricingMonetizationPage";
import LearnPage from "@/pages/learn/LearnPage";
import WebinarsPage from "@/pages/webinars/WebinarsPage";
import PodcastsPage from "@/pages/podcasts/PodcastsPage";
import PodcastDiscoveryPage from "@/pages/podcasts/PodcastDiscoveryPage";
import PodcastShowDetailPage from "@/pages/podcasts/PodcastShowDetailPage";
import PodcastPlayerPage from "@/pages/podcasts/PodcastPlayerPage";
import PodcastLibraryPage from "@/pages/podcasts/PodcastLibraryPage";
import PodcastCreatorStudioPage from "@/pages/podcasts/PodcastCreatorStudioPage";
import PodcastEpisodeDetailPage from "@/pages/podcasts/PodcastEpisodeDetailPage";
import PodcastQueuePage from "@/pages/podcasts/PodcastQueuePage";
import PodcastSeriesPage from "@/pages/podcasts/PodcastSeriesPage";
import PodcastPurchasesPage from "@/pages/podcasts/PodcastPurchasesPage";
import PodcastSubscriptionsPage from "@/pages/podcasts/PodcastSubscriptionsPage";
import PodcastDonationsPage from "@/pages/podcasts/PodcastDonationsPage";
import PodcastRecorderPage from "@/pages/podcasts/PodcastRecorderPage";
import PodcastAnalyticsPage from "@/pages/podcasts/PodcastAnalyticsPage";
import PodcastHostProfilePage from "@/pages/podcasts/PodcastHostProfilePage";
import PodcastCommentsPage from "@/pages/podcasts/PodcastCommentsPage";
import AIToolsHubPage from "@/pages/ai/AIToolsHubPage";
import AIChatWorkspacePage from "@/pages/ai/AIChatWorkspacePage";
import AIWriterPage from "@/pages/ai/AIWriterPage";
import AIImageStudioPage from "@/pages/ai/AIImageStudioPage";
import AIVideoStudioPage from "@/pages/ai/AIVideoStudioPage";
import AIProposalHelperPage from "@/pages/ai/AIProposalHelperPage";
import AIJDHelperPage from "@/pages/ai/AIJDHelperPage";
import AIBriefHelperPage from "@/pages/ai/AIBriefHelperPage";
import AIOutreachAssistantPage from "@/pages/ai/AIOutreachAssistantPage";
import AIRecruiterAssistantPage from "@/pages/ai/AIRecruiterAssistantPage";
import AISupportSummarizerPage from "@/pages/ai/AISupportSummarizerPage";
import AIAnalyticsAssistantPage from "@/pages/ai/AIAnalyticsAssistantPage";
import AIPromptLibraryPage from "@/pages/ai/AIPromptLibraryPage";
import AIHistoryPage from "@/pages/ai/AIHistoryPage";
import AIBillingPage from "@/pages/ai/AIBillingPage";
import AIBYOKPage from "@/pages/ai/AIBYOKPage";
import AISettingsPage from "@/pages/ai/AISettingsPage";
import { AIShell } from "@/components/ai/AIShell";
import LaunchpadHomePage from "@/pages/launchpad/LaunchpadHomePage";
import LaunchpadDiscoverPage from "@/pages/launchpad/LaunchpadDiscoverPage";
import LaunchpadOpportunitiesPage from "@/pages/launchpad/LaunchpadOpportunitiesPage";
import LaunchpadPathwaysPage from "@/pages/launchpad/LaunchpadPathwaysPage";
import LaunchpadChallengesPage from "@/pages/launchpad/LaunchpadChallengesPage";
import LaunchpadApplicationsPage from "@/pages/launchpad/LaunchpadApplicationsPage";
import LaunchpadEventsPage from "@/pages/launchpad/LaunchpadEventsPage";
import LaunchpadEnterprisePage from "@/pages/launchpad/LaunchpadEnterprisePage";
import LaunchpadSavedPage from "@/pages/launchpad/LaunchpadSavedPage";
import LaunchpadJobsPage from "@/pages/launchpad/LaunchpadJobsPage";
import LaunchpadHostsPage from "@/pages/launchpad/LaunchpadHostsPage";
import EarlyCareerPage from "@/pages/launchpad/EarlyCareerPage";
import GraduateOpportunitiesPage from "@/pages/launchpad/GraduateOpportunitiesPage";
import SchoolLeaverPage from "@/pages/launchpad/SchoolLeaverPage";
import CareerChangerPage from "@/pages/launchpad/CareerChangerPage";
import ExperienceProjectsPage from "@/pages/launchpad/ExperienceProjectsPage";
import MentorMatchingPage from "@/pages/launchpad/MentorMatchingPage";
import MentorSessionsPage from "@/pages/launchpad/MentorSessionsPage";
import LearningPathsPage from "@/pages/launchpad/LearningPathsPage";
import PortfolioBuilderPage from "@/pages/launchpad/PortfolioBuilderPage";
import BadgesVerificationPage from "@/pages/launchpad/BadgesVerificationPage";
import LaunchpadCommunityPage from "@/pages/launchpad/LaunchpadCommunityPage";
import LaunchpadAnalyticsPage from "@/pages/launchpad/LaunchpadAnalyticsPage";
import EmployerPartnerPage from "@/pages/launchpad/EmployerPartnerPage";
import LaunchpadSettingsPage from "@/pages/launchpad/LaunchpadSettingsPage";
import ServicesBrowsePage from "@/pages/services/ServicesBrowsePage";
import ServiceDetailPageFull from "@/pages/services/ServiceDetailPageFull";
import ServiceListingBuilderPageFull from "@/pages/services/ServiceListingBuilderPageFull";
import ServicePackagesBuilderPage from "@/pages/services/ServicePackagesBuilderPage";
import ServiceAvailabilityPage from "@/pages/services/ServiceAvailabilityPage";
import ServiceBookingPage from "@/pages/services/ServiceBookingPage";
import ServiceOrdersCenterPage from "@/pages/services/ServiceOrdersCenterPage";
import ServiceDeliveryPage from "@/pages/services/ServiceDeliveryPage";
import ServiceAnalyticsPage from "@/pages/services/ServiceAnalyticsPage";
import ServicePromotionsPage from "@/pages/services/ServicePromotionsPage";
import WebinarDiscoveryPage from "@/pages/webinars/WebinarDiscoveryPage";
import WebinarDetailPage from "@/pages/webinars/WebinarDetailPage";
import WebinarLobbyPage from "@/pages/webinars/WebinarLobbyPage";
import WebinarLivePlayerPage from "@/pages/webinars/WebinarLivePlayerPage";
import WebinarReplayPage from "@/pages/webinars/WebinarReplayPage";
import WebinarHostStudioPage from "@/pages/webinars/WebinarHostStudioPage";
import WebinarRegistrationPage from "@/pages/webinars/WebinarRegistrationPage";
import WebinarCheckoutPage from "@/pages/webinars/WebinarCheckoutPage";
import WebinarChatPage from "@/pages/webinars/WebinarChatPage";
import WebinarLibraryPage from "@/pages/webinars/WebinarLibraryPage";
import WebinarSeriesPage from "@/pages/webinars/WebinarSeriesPage";
import WebinarDonationsPage from "@/pages/webinars/WebinarDonationsPage";
import WebinarPurchasesPage from "@/pages/webinars/WebinarPurchasesPage";
import WebinarAnalyticsPage from "@/pages/webinars/WebinarAnalyticsPage";
import WebinarSettingsPage from "@/pages/webinars/WebinarSettingsPage";
import InternalAdminLoginPage from "@/pages/admin/InternalAdminLoginPage";
import InternalAdminShellPage from "@/pages/admin/InternalAdminShellPage";
import CustomerServiceDashboardPage from "@/pages/support/CustomerServiceDashboardPage";
import DisputeOperationsDashboardPage from "@/pages/disputes/DisputeOperationsDashboardPage";
import ModeratorDashboardPage from "@/pages/admin/ModeratorDashboardPage";
import TrustSafetyDashboardPage from "@/pages/admin/TrustSafetyDashboardPage";
import AdsOpsDashboardPage from "@/pages/ads/AdsOpsDashboardPage";
import VerificationComplianceDashboardPage from "@/pages/admin/VerificationComplianceDashboardPage";
import SuperAdminCommandPage from "@/pages/admin/SuperAdminPage";
import InternalSearchPage from "@/pages/admin/InternalSearchPage";
import InternalAuditPage from "@/pages/admin/InternalAuditPage";
import { AdminShell } from "@/components/layout/AdminShell";
import DisputeIntakePage from "@/pages/disputes/DisputeIntakePage";
import DisputeDetailPage from "@/pages/disputes/DisputeDetailPage";
import ArbitrationReviewPage from "@/pages/disputes/ArbitrationReviewPage";
import EscrowLedgerPage from "@/pages/finance/EscrowLedgerPage";
import ReleaseFundsPage from "@/pages/escrow/ReleaseFundsPage";
import RefundRequestPage from "@/pages/escrow/RefundRequestPage";
import EvidenceUploadPage from "@/pages/disputes/EvidenceUploadPage";
import CounterResponsePage from "@/pages/disputes/CounterResponsePage";
import MediationViewPage from "@/pages/disputes/MediationViewPage";
import ResolutionHistoryPage from "@/pages/disputes/ResolutionHistoryPage";
import InboxThreadPage from "@/pages/inbox/InboxThreadPage";
import ThreadDetailPage from "@/pages/inbox/ThreadDetailPage";
import ChatSharedFilesPage from "@/pages/inbox/ChatSharedFilesPage";
import ChatLinkedContextPage from "@/pages/inbox/ChatLinkedContextPage";
import ChatCallFlowPage from "@/pages/inbox/ChatCallFlowPage";
import ChatBookingPage from "@/pages/inbox/ChatBookingPage";
import ChatCustomOfferPage from "@/pages/inbox/ChatCustomOfferPage";
import ChatSearchPage from "@/pages/inbox/ChatSearchPage";
import ChatSettingsPage from "@/pages/inbox/ChatSettingsPage";
import UnreadMentionCenterPage from "@/pages/inbox/UnreadMentionCenterPage";
import GroupChatsPage from "@/pages/inbox/GroupChatsPage";
import ChannelsPage from "@/pages/inbox/ChannelsPage";
import AdvisorConsolePage from "@/pages/support/AdvisorConsolePage";
import SearchCommandCenterPage from "@/pages/explore/SearchCommandCenterPage";
import NotFound from "@/pages/NotFound";
import TeamManagementPage from "@/pages/org/TeamManagementPage";
import OrgSettingsPage from "@/pages/org/OrgSettingsPage";
import ProfileEditPage from "@/pages/profile/ProfileEditPage";
import GigCheckoutPage from "@/pages/checkout/GigCheckoutPage";
import ServiceCheckoutPage from "@/pages/checkout/ServiceCheckoutPage";
import ProjectFundingPage from "@/pages/checkout/ProjectFundingPage";
import StartupShowcasePage from "@/pages/enterprise/StartupShowcasePage";
import StartupDetailPage from "@/pages/enterprise/StartupDetailPage";
import { useRole } from "@/contexts/RoleContext";

// Role-aware dashboard router
const RoleDashboardRouter = () => {
  const { activeRole } = useRole();
  if (activeRole === 'professional') return <ProfessionalDashboardPage />;
  if (activeRole === 'enterprise') return <EnterpriseDashboardPage />;
  // all other roles use UserDashboardPage with role-conditional features
  return <UserDashboardPage />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RoleProvider>
        <WorkspaceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth routes – standalone shell (no PublicShell wrapping) */}
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/account-locked" element={<AccountLockedPage />} />

              {/* Public Shell */}
              <Route element={<PublicShell />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/user-agreements" element={<UserAgreementsPage />} />
                <Route path="/trust-safety" element={<TrustSafetyPage />} />
                <Route path="/status" element={<StatusPage />} />
                <Route path="/legal/disputes-policy" element={<DisputesPolicyPage />} />
                <Route path="/legal/payments-escrow" element={<PaymentsEscrowPolicyPage />} />
                <Route path="/legal/advertising-policy" element={<AdvertisingPolicyPage />} />
                <Route path="/legal/creator-monetization" element={<CreatorMonetizationPolicyPage />} />
                <Route path="/legal/community-guidelines" element={<CommunityGuidelinesPage />} />
                <Route path="/legal/appeals" element={<AppealsPolicyPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/support/contact" element={<ContactPage />} />
                <Route path="/product" element={<ProductPage />} />
                <Route path="/solutions" element={<SolutionsPage />} />
                <Route path="/solutions/:role" element={<SolutionsPage />} />
                <Route path="/showcase/jobs" element={<ShowcaseJobsPage />} />
                <Route path="/showcase/gigs" element={<ShowcaseGigsPage />} />
                <Route path="/showcase/projects" element={<ShowcaseProjectsPage />} />
                <Route path="/showcase/services" element={<ShowcaseServicesPage />} />
                <Route path="/showcase/recruiter-pro" element={<ShowcaseRecruiterPage />} />
                <Route path="/showcase/sales-navigator" element={<ShowcaseNavigatorPage />} />
                <Route path="/showcase/enterprise-connect" element={<ShowcaseEnterprisePage />} />
                <Route path="/showcase/ads" element={<ShowcaseAdsPage />} />
                <Route path="/showcase/networking" element={<ShowcaseNetworkingPage />} />
                <Route path="/showcase/events" element={<ShowcaseEventsPage />} />
                <Route path="/showcase/podcasts" element={<ShowcasePodcastsPage />} />
                <Route path="/showcase/mentorship" element={<ShowcaseMentorshipPage />} />
                <Route path="/showcase/creator-studio" element={<ShowcaseCreatorPage />} />
                <Route path="/showcase/launchpad" element={<ShowcaseLaunchpadPage />} />
              </Route>

              {/* Logged-in Shell */}
              <Route element={<LoggedInShell />}>
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/explore" element={<ExplorerPage />} />
                <Route path="/explore/people" element={<PeopleSearchPage />} />
                <Route path="/explore/jobs" element={<JobsSearchPage />} />
                <Route path="/explore/projects" element={<ProjectsSearchPage />} />
                <Route path="/explore/gigs" element={<GigsSearchPage />} />
                <Route path="/explore/services" element={<ServicesSearchPage />} />
                <Route path="/explore/events" element={<EventsSearchPage />} />
                <Route path="/explore/groups" element={<GroupsSearchPage />} />
                <Route path="/explore/podcasts" element={<PodcastsSearchPage />} />
                <Route path="/explore/webinars" element={<WebinarsSearchPage />} />
                <Route path="/explore/pages" element={<PagesSearchPage />} />
                <Route path="/explore/saved" element={<SavedSearchesPage />} />
                <Route path="/explore/map" element={<SearchMapViewPage />} />
                <Route path="/explore/compare" element={<SearchComparePreviewPage />} />
                <Route path="/search" element={<SearchCommandCenterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/profile/:userId/activity" element={<ProfileActivityPage />} />
                <Route path="/profile/:userId/services" element={<ProfileServicesTab />} />
                <Route path="/profile/:userId/gigs" element={<ProfileGigsTab />} />
                <Route path="/profile/:userId/projects" element={<ProfileProjectsTab />} />
                <Route path="/profile/:userId/reviews" element={<ProfileReviewsTab />} />
                <Route path="/profile/:userId/media" element={<ProfileMediaTab />} />
                <Route path="/profile/:userId/events" element={<ProfileEventsTab />} />
                <Route path="/profile/:userId/network" element={<ProfileNetworkTab />} />
                <Route path="/creator/:userId" element={<CreatorProfilePage />} />
                <Route path="/page-analytics" element={<PageAnalyticsPage />} />
                <Route path="/page-admin" element={<PageAdminControlsPage />} />
                <Route path="/networking" element={<NetworkingHomePage />} />
                <Route path="/networking/connections" element={<ConnectionsHubPage />} />
                <Route path="/networking/followers" element={<FollowersHubPage />} />
                <Route path="/networking/following" element={<FollowingHubPage />} />
                <Route path="/networking/suggestions" element={<SuggestedConnectionsPage />} />
                <Route path="/networking/invitations" element={<PendingInvitationsPage />} />
                <Route path="/networking/cards" element={<DigitalCardGalleryPage />} />
                <Route path="/networking/follow-ups" element={<FollowUpCenterPage />} />
                <Route path="/networking/collaboration" element={<CollaborationSuggestionsPage />} />
                <Route path="/networking/rooms" element={<NetworkingRoomsLobbyPage />} />
                <Route path="/networking/rooms/create" element={<RoomCreationWizardPage />} />
                <Route path="/networking/rooms/:roomId" element={<LiveNetworkingRoomPage />} />
                <Route path="/networking/rooms/:roomId/host" element={<HostConsolePage />} />
                <Route path="/networking/speed" element={<SpeedNetworkingLobbyPage />} />
                <Route path="/networking/speed/live" element={<LiveSpeedNetworkingPage />} />
                <Route path="/networking/sessions" element={<NetworkingSessionsPage />} />
                <Route path="/networking/sessions/analytics" element={<SessionAnalyticsPage />} />
                <Route path="/networking/create" element={<NetworkingPage />} />
                <Route path="/networking/legacy" element={<NetworkingPage />} />
                <Route path="/networking/introductions" element={<IntroductionsPage />} />
                <Route path="/networking/follow-up" element={<PostSessionFollowUpPage />} />
                <Route path="/networking/analytics" element={<NetworkingAnalyticsPage />} />
                {/* Events */}
                <Route path="/events" element={<EventsDiscoveryPage />} />
                <Route path="/events/create" element={<EventCreatePage />} />
                <Route path="/events/:eventId" element={<EventDetailPage />} />
                <Route path="/events/:eventId/rsvp" element={<EventRSVPPage />} />
                <Route path="/events/:eventId/lobby" element={<EventLobbyPage />} />
                <Route path="/events/:eventId/live" element={<EventLiveRoomPage />} />
                <Route path="/events/:eventId/host" element={<EventHostControlsPage />} />
                <Route path="/events/:eventId/attendees" element={<EventAttendeeManagementPage />} />
                <Route path="/events/:eventId/replay" element={<EventReplayPage />} />
                <Route path="/events/:eventId/analytics" element={<EventAnalyticsPage />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/inbox/search" element={<ChatSearchPage />} />
                <Route path="/inbox/settings" element={<ChatSettingsPage />} />
                <Route path="/inbox/files" element={<ChatSharedFilesPage />} />
                <Route path="/inbox/linked" element={<ChatLinkedContextPage />} />
                <Route path="/inbox/unread" element={<UnreadMentionCenterPage />} />
                <Route path="/inbox/groups" element={<GroupChatsPage />} />
                <Route path="/inbox/channels" element={<ChannelsPage />} />
                <Route path="/inbox/:threadId" element={<InboxThreadPage />} />
                <Route path="/inbox/:threadId/detail" element={<ThreadDetailPage />} />
                <Route path="/inbox/:threadId/call" element={<ChatCallFlowPage />} />
                <Route path="/inbox/:threadId/book" element={<ChatBookingPage />} />
                <Route path="/inbox/:threadId/offer" element={<ChatCustomOfferPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/calendar/bookings" element={<BookingsListPage />} />
                <Route path="/calendar/availability" element={<AvailabilitySettingsPage />} />
                <Route path="/calendar/book" element={<BookingWizardPage />} />
                <Route path="/calendar/donate" element={<DonationFlowPage />} />
                <Route path="/calls" element={<CallsVideoPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                {/* Jobs */}
                <Route path="/jobs" element={<JobsBrowsePage />} />
                <Route path="/jobs/create" element={<JobCreatePage />} />
                <Route path="/jobs/:jobId" element={<JobDetailPage />} />
                <Route path="/jobs/applications" element={<ApplicationTrackerPage />} />
                <Route path="/jobs/templates" element={<JobTemplatesPage />} />
                <Route path="/jobs/:jobId/workspace" element={<JobWorkspacePage />} />
                <Route path="/jobs/:jobId/distribution" element={<JobDistributionPage />} />
                <Route path="/jobs/:jobId/applicants" element={<JobApplicantsCenterPage />} />
                <Route path="/jobs/:jobId/screening" element={<JobScreeningPage />} />
                <Route path="/jobs/:jobId/team" element={<HiringTeamPage />} />
                <Route path="/jobs/:jobId/analytics" element={<JobAnalyticsPage />} />
                <Route path="/jobs/archive" element={<JobArchivePage />} />
                {/* Gigs */}
                <Route path="/gigs" element={<GigsDiscoveryPage />} />
                <Route path="/gigs/new" element={<GigCreatePage />} />
                <Route path="/gigs/:gigId" element={<GigDetailPage />} />
                <Route path="/gigs/orders/:orderId" element={<GigOrderPage />} />
                <Route path="/gigs/seller-performance" element={<SellerPerformancePage />} />
                <Route path="/gigs/workspace" element={<GigWorkspaceHomePage />} />
                <Route path="/gigs/packages" element={<GigPackagesBuilderPage />} />
                <Route path="/gigs/requirements" element={<GigRequirementsBuilderPage />} />
                <Route path="/gigs/analytics" element={<GigAnalyticsPage />} />
                <Route path="/gigs/orders" element={<GigOrdersCenterPage />} />
                <Route path="/gigs/pricing" element={<GigPricingIntelPage />} />
                <Route path="/gigs/custom-offers" element={<CustomOffersPage />} />
                <Route path="/gigs/revisions" element={<RevisionManagementPage />} />
                <Route path="/gigs/availability" element={<SellerAvailabilityPage />} />
                <Route path="/gigs/addons" element={<GigAddonsBuilderPage />} />
                <Route path="/gigs/media" element={<GigMediaManagerPage />} />
                <Route path="/gigs/promotions" element={<GigPromotionsPage />} />
                <Route path="/gigs/archive" element={<GigArchivePage />} />
                <Route path="/gigs/create" element={<GigCreatePage />} />
                <Route path="/gigs/manage" element={<GigWorkspaceHomePage />} />
                <Route path="/gigs/mine" element={<GigWorkspaceHomePage />} />
                {/* Offers */}
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/offers/*" element={<OffersPage />} />
                {/* Orders */}
                <Route path="/work" element={<WorkHubPage />} />
                <Route path="/orders" element={<OrdersDashboard />} />
                <Route path="/orders/*" element={<OrdersDashboard />} />
                {/* Projects */}
                <Route path="/projects" element={<ProjectsBrowsePage />} />
                <Route path="/projects/mine" element={<MyProjectsPage />} />
                <Route path="/projects/create" element={<ProjectCreatePage />} />
                <Route path="/projects/new" element={<ProjectCreatePage />} />
                <Route path="/projects/templates" element={<ProjectTemplatesPage />} />
                <Route path="/projects/proposals" element={<ProjectsBrowsePage />} />
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                <Route path="/projects/:projectId/propose" element={<ProposalSubmissionPage />} />
                <Route path="/projects/:projectId/review" element={<ProposalReviewAwardPage />} />
                <Route path="/projects/:projectId/workspace" element={<ProjectWorkspacePage />} />
                <Route path="/projects/:projectId/board" element={<TaskBoardPage />} />
                <Route path="/projects/:projectId/tasks" element={<ProjectTaskTablePage />} />
                <Route path="/projects/:projectId/timeline" element={<ProjectTimelinePage />} />
                <Route path="/projects/:projectId/files" element={<ProjectFilesPage />} />
                <Route path="/projects/:projectId/approvals" element={<ProjectApprovalsPage />} />
                <Route path="/projects/:projectId/risks" element={<ProjectRiskBlockersPage />} />
                <Route path="/projects/:projectId/escrow" element={<ProjectEscrowPage />} />
                <Route path="/projects/:projectId/milestones" element={<ProjectMilestonesPage />} />
                <Route path="/projects/:projectId/dashboard" element={<ProjectDashboardPage />} />
                <Route path="/projects/:projectId/deliverables" element={<ProjectDeliverablesPage />} />
                <Route path="/projects/archive" element={<ProjectArchivePage />} />
                {/* Services */}
                <Route path="/services" element={<ServicesMarketplacePage />} />
                <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
                <Route path="/services/create" element={<ServiceListingBuilderPage />} />
                <Route path="/services/orders" element={<ServiceOrdersPage />} />
                <Route path="/services/mine" element={<ServicesMarketplacePage />} />
                <Route path="/services/analytics" element={<ServicesMarketplacePage />} />
                <Route path="/services/*" element={<ServicesMarketplacePage />} />
                {/* Company Pages */}
                <Route path="/companies/:slug" element={<CompanyPage />} />
                {/* Agency Pages */}
                <Route path="/agencies/:slug" element={<AgencyPage />} />
                <Route path="/agency/dashboard" element={<AgencyManagementDashboardPage />} />
                {/* Org Workspace */}
                <Route path="/org" element={<OrgWorkspacePage />} />
                <Route path="/org/*" element={<OrgWorkspacePage />} />
                <Route path="/org/members" element={<OrgMembersSeatsPage />} />
                <Route path="/org/workspaces" element={<SharedWorkspacesPage />} />
                <Route path="/team" element={<TeamManagementPage />} />
                <Route path="/org/settings" element={<OrgSettingsPage />} />
                <Route path="/profile/edit" element={<ProfileEditPage />} />
                <Route path="/gigs/checkout/:gigId" element={<GigCheckoutPage />} />
                <Route path="/services/checkout/:serviceId" element={<ServiceCheckoutPage />} />
                <Route path="/projects/:projectId/fund" element={<ProjectFundingPage />} />
                <Route path="/enterprise-connect/startups" element={<StartupShowcasePage />} />
                <Route path="/enterprise-connect/startups/:id" element={<StartupDetailPage />} />
                <Route path="/resource-planning" element={<ResourcePlanningPage />} />
                <Route path="/mentorship" element={<MentorMarketplacePage />} />
                <Route path="/mentorship/profile/:mentorId" element={<MentorProfilePage />} />
                <Route path="/mentorship/book/:mentorId" element={<MentorBookingPage />} />
                <Route path="/mentorship/feedback" element={<MentorFeedbackPage />} />
                <Route path="/mentorship/analytics" element={<MentorAnalyticsPage />} />
                <Route path="/mentorship/payments" element={<MentorPaymentsPage />} />
                {/* Hire — Unified Recruitment Command Center */}
                <Route path="/hire" element={<HireCommandCenter />} />
                <Route path="/hire/jobs" element={<HirePageWrapper label="Jobs"><RecruiterJobsPage /></HirePageWrapper>} />
                <Route path="/hire/jobs/create" element={<HireJobCreatePage />} />
                <Route path="/hire/jobs/:id" element={<HirePageWrapper label="Job Detail"><RecruiterJobWorkspacePage /></HirePageWrapper>} />
                <Route path="/hire/search" element={<HirePageWrapper label="Talent Search"><RecruiterTalentSearchPage /></HirePageWrapper>} />
                <Route path="/hire/pipeline" element={<HirePageWrapper label="Pipeline"><RecruiterPipelinePage /></HirePageWrapper>} />
                <Route path="/hire/interviews" element={<HirePageWrapper label="Interviews"><RecruiterInterviewsPage /></HirePageWrapper>} />
                <Route path="/hire/scorecards" element={<HireScorecardsPage />} />
                <Route path="/hire/team" element={<HireTeamPage />} />
                <Route path="/hire/pools" element={<HireTalentPoolsPage />} />
                <Route path="/hire/match" element={<HirePageWrapper label="Match Center"><RecruiterMatchCenterPage /></HirePageWrapper>} />
                <Route path="/hire/outreach" element={<HirePageWrapper label="Outreach"><RecruiterOutreachPage /></HirePageWrapper>} />
                <Route path="/hire/outreach-templates" element={<HirePageWrapper label="Templates"><RecruiterOutreachTemplatesPage /></HirePageWrapper>} />
                <Route path="/hire/offers" element={<HirePageWrapper label="Offers"><RecruiterOffersPage /></HirePageWrapper>} />
                <Route path="/hire/analytics" element={<HirePageWrapper label="Analytics"><RecruiterAnalyticsPage /></HirePageWrapper>} />
                <Route path="/hire/billing" element={<HirePageWrapper label="Billing"><RecruiterBillingPage /></HirePageWrapper>} />
                <Route path="/hire/notes" element={<HirePageWrapper label="Notes"><RecruiterCandidateNotesPage /></HirePageWrapper>} />
                <Route path="/hire/seats" element={<HirePageWrapper label="Seats"><RecruiterSeatsPage /></HirePageWrapper>} />
                <Route path="/hire/settings" element={<HireSettingsPage />} />
                {/* Legacy redirects — old routes point to new /hire/* */}
                <Route path="/recruiter-pro" element={<HireCommandCenter />} />
                <Route path="/recruiter-pro/jobs" element={<HirePageWrapper label="Jobs"><RecruiterJobWorkspacePage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/search" element={<HirePageWrapper label="Search"><RecruiterCandidateSearchPage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/match" element={<HirePageWrapper label="Match"><RecruiterMatchCenterPage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/pools" element={<HireTalentPoolsPage />} />
                <Route path="/recruiter-pro/outreach" element={<HirePageWrapper label="Outreach"><RecruiterOutreachPage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/pipeline" element={<HirePageWrapper label="Pipeline"><RecruiterPipelinePage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/interviews" element={<HirePageWrapper label="Interviews"><RecruiterInterviewsPage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/scorecards" element={<HireScorecardsPage />} />
                <Route path="/recruiter-pro/team" element={<HireTeamPage />} />
                <Route path="/recruiter-pro/analytics" element={<HirePageWrapper label="Analytics"><RecruiterAnalyticsPage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/billing" element={<HirePageWrapper label="Billing"><RecruiterBillingPage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/outreach-templates" element={<HirePageWrapper label="Templates"><RecruiterOutreachTemplatesPage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/notes" element={<HirePageWrapper label="Notes"><RecruiterCandidateNotesPage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/seats" element={<HirePageWrapper label="Seats"><RecruiterSeatsPage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/settings" element={<HireSettingsPage />} />
                <Route path="/recruiter-pro/talent" element={<HirePageWrapper label="Talent"><RecruiterTalentSearchPage /></HirePageWrapper>} />
                <Route path="/recruiter-pro/offers" element={<HirePageWrapper label="Offers"><RecruiterOffersPage /></HirePageWrapper>} />
                <Route path="/recruiter/jobs" element={<HirePageWrapper label="Jobs"><RecruiterJobsPage /></HirePageWrapper>} />
                <Route path="/recruiter/management" element={<HirePageWrapper label="Management"><RecruiterManagementPage /></HirePageWrapper>} />
                <Route path="/recruiter/talent" element={<HirePageWrapper label="Talent"><RecruiterTalentSearchPage /></HirePageWrapper>} />
                <Route path="/recruiter/interviews" element={<HirePageWrapper label="Interviews"><RecruiterInterviewsPage /></HirePageWrapper>} />
                <Route path="/recruiter/pipeline" element={<HirePageWrapper label="Pipeline"><RecruiterPipelinePage /></HirePageWrapper>} />
                <Route path="/recruiter/offers" element={<HirePageWrapper label="Offers"><RecruiterOffersPage /></HirePageWrapper>} />
                <Route path="/recruiter/analytics" element={<HirePageWrapper label="Analytics"><RecruiterAnalyticsPage /></HirePageWrapper>} />
                {/* Sales Navigator / Gigvora Navigator */}
                <Route path="/sales-navigator" element={<SalesNavigatorPage />} />
                <Route path="/navigator" element={<SalesNavigatorPage />} />
                <Route path="/navigator/leads" element={<NavigatorLeadsPage />} />
                <Route path="/navigator/talent" element={<NavigatorTalentPage />} />
                <Route path="/navigator/accounts" element={<NavigatorAccountsPage />} />
                <Route path="/navigator/company-intel" element={<NavigatorCompanyIntelPage />} />
                <Route path="/navigator/outreach" element={<NavigatorOutreachPage />} />
                <Route path="/navigator/graph" element={<NavigatorGraphPage />} />
                <Route path="/navigator/geo" element={<NavigatorGeoPage />} />
                <Route path="/navigator/signals" element={<NavigatorSignalsPage />} />
                <Route path="/navigator/analytics" element={<NavigatorAnalyticsPage />} />
                <Route path="/navigator/saved-lists" element={<NavigatorSavedListsPage />} />
                <Route path="/navigator/smart-lists" element={<NavigatorSmartListsPage />} />
                <Route path="/navigator/seats" element={<NavigatorSeatsPage />} />
                <Route path="/navigator/saved-talent" element={<NavigatorSavedTalentListsPage />} />
                <Route path="/navigator/outreach-templates" element={<NavigatorOutreachTemplatesPage />} />
                <Route path="/navigator/hiring-signals" element={<NavigatorHiringSignalsPage />} />
                <Route path="/navigator/engagement" element={<NavigatorEngagementSignalsPage />} />
                <Route path="/navigator/settings" element={<NavigatorSettingsPage />} />
                <Route path="/sales-navigator/*" element={<SalesNavigatorPage />} />
                {/* Gigvora Ads */}
                <Route path="/ads" element={<AdsHomePage />} />
                <Route path="/ads/campaigns" element={<AdsCampaignListPage />} />
                <Route path="/ads/campaign-detail" element={<AdsCampaignDetailPage />} />
                <Route path="/ads/adset-builder" element={<AdsAdSetBuilderPage />} />
                <Route path="/ads/creative-builder" element={<AdsCreativeBuilderPage />} />
                <Route path="/ads/assets" element={<AdsAssetLibraryPage />} />
                <Route path="/ads/audience-builder" element={<AdsAudienceBuilderPage />} />
                <Route path="/ads/keyword-builder" element={<AdsKeywordBuilderPage />} />
                <Route path="/ads/geo-targeting" element={<AdsGeoTargetingPage />} />
                <Route path="/ads/forecasting" element={<AdsForecastingPage />} />
                <Route path="/ads/bid-budget" element={<AdsBidBudgetPage />} />
                <Route path="/ads/billing" element={<AdsBillingPage />} />
                <Route path="/ads/analytics" element={<AdsAnalyticsPage />} />
                <Route path="/ads/creative-compare" element={<AdsCreativeComparePage />} />
                <Route path="/ads/attribution" element={<AdsAttributionPage />} />
                <Route path="/ads/ops" element={<AdsOpsDashboardPage />} />
                <Route path="/ads/manager" element={<AdsManagerPage />} />
                <Route path="/ads/saved-audiences" element={<AdsSavedAudiencesPage />} />
                <Route path="/ads/placements" element={<AdsPlacementManagerPage />} />
                <Route path="/ads/audience-insights" element={<AdsAudienceInsightsPage />} />
                <Route path="/ads/creative-performance" element={<AdsCreativePerformancePage />} />
                <Route path="/ads/policy-review" element={<AdsPolicyReviewPage />} />
                <Route path="/ads/*" element={<AdsHomePage />} />
                <Route path="/geo" element={<MapGeoIntelPage />} />
                <Route path="/geo/*" element={<MapGeoIntelPage />} />
                {/* Launchpad - specific routes are below, keep catchall last */}
                {/* Volunteering */}
                <Route path="/volunteering" element={<VolunteeringPage />} />
                <Route path="/volunteering/*" element={<VolunteeringPage />} />
                {/* Enterprise Connect */}
                <Route path="/enterprise-connect" element={<EnterpriseConnectHomePage />} />
                <Route path="/enterprise-connect/directory" element={<EnterpriseDirectoryPage />} />
                <Route path="/enterprise-connect/directory/:handle" element={<EnterpriseProfilePage />} />
                <Route path="/enterprise-connect/profile" element={<EnterpriseProfilePage />} />
                <Route path="/enterprise-connect/partners" element={<EnterprisePartnerDiscoveryPage />} />
                <Route path="/enterprise-connect/procurement" element={<EnterpriseProcurementPage />} />
                <Route path="/enterprise-connect/intros" element={<EnterpriseIntrosPage />} />
                <Route path="/enterprise-connect/events" element={<EnterpriseEventsPage />} />
                <Route path="/enterprise-connect/rooms" element={<EnterpriseRoomsPage />} />
                <Route path="/enterprise-connect/analytics" element={<EnterpriseAnalyticsPage />} />
                <Route path="/enterprise-connect/saved" element={<EnterpriseSavedListsPage />} />
                <Route path="/enterprise-connect/legacy" element={<EnterpriseConnectPage />} />
                <Route path="/enterprise-connect/matchmaking" element={<EnterpriseMatchmakingPage />} />
                <Route path="/enterprise-connect/activity" element={<EnterpriseActivitySignalsPage />} />
                <Route path="/enterprise-connect/settings" element={<EnterpriseConnectSettingsPage />} />
                <Route path="/enterprise-connect/*" element={<EnterpriseConnectHomePage />} />
                {/* Enterprise Hiring Workspace */}
                <Route path="/enterprise/hiring" element={<EnterpriseHiringWorkspacePage />} />
                <Route path="/enterprise/dashboard" element={<EnterpriseDashboardPage />} />
                <Route path="/enterprise/hiring/*" element={<EnterpriseHiringWorkspacePage />} />
                {/* Candidate Availability & Matching */}
                <Route path="/candidate/availability" element={<CandidateAvailabilityPage />} />
                <Route path="/candidate/availability/*" element={<CandidateAvailabilityPage />} />
                {/* Finance */}
                <Route path="/finance" element={<FinanceHubPage />} />
                <Route path="/finance/wallet" element={<WalletPage />} />
                <Route path="/finance/billing" element={<BillingPage />} />
                <Route path="/finance/invoices" element={<InvoicesPage />} />
                <Route path="/finance/payouts" element={<PayoutsPage />} />
                <Route path="/finance/commerce" element={<CommercePatronagePage />} />
                <Route path="/finance/commerce/*" element={<CommercePatronagePage />} />
                <Route path="/finance/pricing" element={<PricingMonetizationPage />} />
                <Route path="/finance/pricing/*" element={<PricingMonetizationPage />} />
                <Route path="/finance/*" element={<FinanceHubPage />} />
                {/* Contracts */}
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/contracts/:contractId/milestones" element={<MilestonesPage />} />
                <Route path="/contracts/:contractId/escrow" element={<EscrowPage />} />
                <Route path="/contracts/sow" element={<ContractsSOWPage />} />
                <Route path="/contracts/*" element={<ContractsPage />} />
                {/* Disputes */}
                <Route path="/disputes" element={<DisputesPage />} />
                <Route path="/disputes/new" element={<DisputeIntakePage />} />
                <Route path="/disputes/:disputeId" element={<DisputeDetailPage />} />
                <Route path="/disputes/:disputeId/evidence" element={<EvidenceUploadPage />} />
                <Route path="/disputes/:disputeId/counter" element={<CounterResponsePage />} />
                <Route path="/disputes/:disputeId/mediation" element={<MediationViewPage />} />
                <Route path="/disputes/arbitration" element={<ArbitrationReviewPage />} />
                <Route path="/disputes/history" element={<ResolutionHistoryPage />} />
                <Route path="/disputes/*" element={<DisputesPage />} />
                {/* Escrow */}
                <Route path="/escrow" element={<EscrowLedgerPage />} />
                <Route path="/escrow/ledger" element={<EscrowLedgerPage />} />
                <Route path="/escrow/release" element={<ReleaseFundsPage />} />
                <Route path="/escrow/refund" element={<RefundRequestPage />} />
                {/* Support */}
                <Route path="/help" element={<SupportCenterPage />} />
                <Route path="/help/categories" element={<HelpCategoryPage />} />
                <Route path="/help/article/:articleId" element={<HelpArticleDetailPage />} />
                <Route path="/help/submit" element={<TicketSubmissionPage />} />
                <Route path="/help/tickets" element={<MyTicketsPage />} />
                <Route path="/help/tickets/:ticketId" element={<TicketDetailPage />} />
                <Route path="/help/escalations" element={<EscalationsPage />} />
                <Route path="/help/search" element={<SupportSearchPage />} />
                <Route path="/help/advisor" element={<AdvisorConsolePage />} />
                {/* Trust & Reputation */}
                <Route path="/trust" element={<TrustPage />} />
                <Route path="/trust/*" element={<TrustPage />} />
                {/* Internal Admin Login — standalone, outside AdminShell, but inside AdminAuthProvider */}
                <Route path="/admin/login" element={<AdminAuthProvider><InternalAdminLoginPage /></AdminAuthProvider>} />
                <Route path="/internal/admin-login" element={<AdminAuthProvider><InternalAdminLoginPage /></AdminAuthProvider>} />
                {/* Admin Terminal — wrapped in AdminAuthProvider + AdminGuard + AdminShell */}
                <Route path="/admin" element={
                  <AdminAuthProvider>
                    <AdminGuard>
                      <AdminShell />
                    </AdminGuard>
                  </AdminAuthProvider>
                }>
                  <Route index element={<AdminPortalLandingPage />} />
                  <Route path="ops" element={<AdminOpsPage />} />
                  <Route path="moderation" element={<AdminOpsPage />} />
                  <Route path="trust" element={<AdminOpsPage />} />
                  <Route path="finance" element={<FinanceAdminPage />} />
                  <Route path="compliance" element={<FinanceAdminPage />} />
                  <Route path="finance-dashboard" element={<FinanceAdminPage />} />
                  <Route path="shell" element={<InternalAdminShellPage />} />
                  <Route path="cs-dashboard" element={<CustomerServiceDashboardPage />} />
                  <Route path="dispute-ops" element={<DisputeOperationsDashboardPage />} />
                  <Route path="moderator-dashboard" element={<ModeratorDashboardPage />} />
                  <Route path="trust-safety" element={<TrustSafetyDashboardPage />} />
                  <Route path="ads-ops" element={<AdsOpsDashboardPage />} />
                  <Route path="verification-compliance" element={<VerificationComplianceDashboardPage />} />
                  <Route path="super-admin" element={<SuperAdminCommandPage />} />
                  <Route path="search" element={<InternalSearchPage />} />
                  <Route path="audit" element={<InternalAuditPage />} />
                  {/* AD-017 Marketing Admin Portal */}
                  <Route path="marketing" element={<MarketingAdminLandingPage />} />
                  <Route path="marketing/ads-moderation" element={<AdsModerationPage />} />
                  <Route path="marketing/campaigns" element={<CampaignsPage />} />
                  <Route path="marketing/traffic" element={<TrafficAnalyticsPage />} />
                  <Route path="marketing/seo" element={<SeoToolsPage />} />
                  <Route path="marketing/ip-analysis" element={<IpAnalysisPage />} />
                  <Route path="marketing/location-analysis" element={<LocationAnalysisPage />} />
                  <Route path="marketing/inbox" element={<MarketingInboxPage />} />
                  <Route path="marketing/emails" element={<MarketingEmailsPage />} />
                  <Route path="marketing/tasks" element={<MarketingTasksPage />} />
                  <Route path="marketing/notices" element={<MarketingNoticesPage />} />
                  {/* AD-018 Customer Service Admin Portal */}
                  <Route path="cs" element={<CustomerServiceLandingPage />} />
                  <Route path="cs/tickets" element={<CsTicketsPage />} />
                  <Route path="cs/tickets/:ticketId" element={<CsTicketDetailPage />} />
                  <Route path="cs/escalations" element={<CsEscalationsPage />} />
                  <Route path="cs/tasks" element={<CsTasksPage />} />
                  <Route path="cs/internal-chat" element={<CsInternalChatPage />} />
                  <Route path="cs/customer-chat" element={<CsCustomerChatPage />} />
                  <Route path="cs/emails" element={<CsEmailsPage />} />
                  <Route path="cs/notes" element={<CsNotesPage />} />
                  <Route path="cs/notices" element={<CsNoticesPage />} />
                  <Route path="cs/notifications" element={<CsNotificationsPage />} />
                  <Route path="cs/analytics" element={<CsAnalyticsPage />} />
                  <Route path="cs/kpi-cards" element={<CsKpiCardsPage />} />
                  {/* AD-019 Finance Admin Portal */}
                  <Route path="finance" element={<FinanceLandingPage />} />
                  <Route path="finance/tickets" element={<FinTicketsPage />} />
                  <Route path="finance/tasks" element={<FinTasksPage />} />
                  <Route path="finance/internal-chat" element={<FinInternalChatPage />} />
                  <Route path="finance/customer-chat" element={<FinCustomerChatPage />} />
                  <Route path="finance/emails" element={<FinEmailsPage />} />
                  <Route path="finance/notices" element={<FinNoticesPage />} />
                  <Route path="finance/notifications" element={<FinNotificationsPage />} />
                  <Route path="finance/transactions" element={<FinTransactionsPage />} />
                  <Route path="finance/escrow" element={<FinEscrowPage />} />
                  <Route path="finance/records" element={<FinRecordsPage />} />
                  <Route path="finance/subscriptions" element={<FinSubscriptionsPage />} />
                  <Route path="finance/credits" element={<FinCreditsPage />} />
                  <Route path="finance/earnings" element={<FinEarningsPage />} />
                  <Route path="finance/commissions" element={<FinCommissionsPage />} />
                  <Route path="finance/ad-spend" element={<FinAdSpendPage />} />
                  <Route path="finance/bank-details" element={<FinBankDetailsPage />} />
                  <Route path="finance/analytics" element={<FinAnalyticsPage />} />
                  <Route path="finance/kpi-cards" element={<FinKpiCardsPage />} />
                  {/* AD-020 Moderator & Trust Review Portal */}
                  <Route path="moderation" element={<ModerationLandingPage />} />
                  <Route path="moderation/tickets" element={<ModTicketsPage />} />
                  <Route path="moderation/tasks" element={<ModTasksPage />} />
                  <Route path="moderation/internal-chat" element={<ModInternalChatPage />} />
                  <Route path="moderation/customer-chat" element={<ModCustomerChatPage />} />
                  <Route path="moderation/emails" element={<ModEmailsPage />} />
                  <Route path="moderation/notices" element={<ModNoticesPage />} />
                  <Route path="moderation/notifications" element={<ModNotificationsPage />} />
                  <Route path="moderation/live-feed" element={<ModLiveFeedPage />} />
                  <Route path="moderation/chats" element={<ModChatsPage />} />
                  <Route path="moderation/communications" element={<ModCommunicationsPage />} />
                  <Route path="moderation/video-comments" element={<ModVideoCommentsPage />} />
                  <Route path="moderation/documents" element={<ModDocumentsPage />} />
                  <Route path="moderation/ads" element={<ModAdsPage />} />
                  <Route path="moderation/companies" element={<ModCompaniesPage />} />
                  <Route path="moderation/users" element={<ModUsersPage />} />
                  <Route path="moderation/trust" element={<ModTrustPage />} />
                  <Route path="moderation/analytics" element={<ModAnalyticsPage />} />
                  <Route path="moderation/kpi-cards" element={<ModKpiCardsPage />} />
                  {/* AD-022 Super Admin Governance */}
                  <Route path="super" element={<SuperAdminLandingPage />} />
                  <Route path="super/kpis" element={<SuperKpisPage />} />
                  <Route path="super/flags" element={<SuperFlagsPage />} />
                  <Route path="super/admins" element={<SuperAdminsPage />} />
                  <Route path="super/entitlements" element={<SuperEntitlementsPage />} />
                  <Route path="super/settings" element={<SuperSettingsPage />} />
                  <Route path="super/emergency" element={<SuperEmergencyPage />} />
                  <Route path="super/audit" element={<SuperAuditPage />} />
                  <Route path="super/system" element={<SuperSystemPage />} />
                  <Route path="*" element={<AdminPage />} />
                </Route>
                {/* Legacy /internal/* redirects */}
                <Route path="/internal/admin-shell" element={<InternalAdminShellPage />} />
                <Route path="/internal/customer-service" element={<CustomerServiceDashboardPage />} />
                <Route path="/internal/customer-service/*" element={<CustomerServiceDashboardPage />} />
                <Route path="/internal/dispute-operations-dashboard" element={<DisputeOperationsDashboardPage />} />
                <Route path="/internal/dispute-operations-dashboard/*" element={<DisputeOperationsDashboardPage />} />
                <Route path="/internal/moderator-dashboard" element={<ModeratorDashboardPage />} />
                <Route path="/internal/moderator-dashboard/*" element={<ModeratorDashboardPage />} />
                <Route path="/internal/trust-safety-ml-dashboard" element={<TrustSafetyDashboardPage />} />
                <Route path="/internal/trust-safety-ml-dashboard/*" element={<TrustSafetyDashboardPage />} />
                <Route path="/internal/ads-ops-dashboard" element={<AdsOpsDashboardPage />} />
                <Route path="/internal/ads-ops-dashboard/*" element={<AdsOpsDashboardPage />} />
                <Route path="/internal/verification-compliance-dashboard" element={<VerificationComplianceDashboardPage />} />
                <Route path="/internal/verification-compliance-dashboard/*" element={<VerificationComplianceDashboardPage />} />
                <Route path="/internal/super-admin-command-center" element={<SuperAdminCommandPage />} />
                <Route path="/internal/super-admin-command-center/*" element={<SuperAdminCommandPage />} />
                <Route path="/internal/finance-admin-dashboard" element={<FinanceAdminPage />} />
                {/* Website Settings */}
                <Route path="/website-settings" element={<WebsiteSettingsPage />} />
                <Route path="/website-settings/*" element={<WebsiteSettingsPage />} />
                {/* Account Settings */}
                <Route path="/settings" element={<SettingsPage />} />
                {/* Learning */}
                <Route path="/learn" element={<LearnPage />} />
                <Route path="/learn/*" element={<LearnPage />} />
                {/* Webinars */}
                <Route path="/webinars" element={<WebinarDiscoveryPage />} />
                <Route path="/webinars/:webinarId" element={<WebinarDetailPage />} />
                <Route path="/webinars/:webinarId/lobby" element={<WebinarLobbyPage />} />
                <Route path="/webinars/:webinarId/live" element={<WebinarLivePlayerPage />} />
                <Route path="/webinars/:webinarId/replay" element={<WebinarReplayPage />} />
                <Route path="/webinars/host" element={<WebinarHostStudioPage />} />
                <Route path="/webinars/legacy" element={<WebinarsPage />} />
                <Route path="/webinars/:webinarId/register" element={<WebinarRegistrationPage />} />
                <Route path="/webinars/:webinarId/checkout" element={<WebinarCheckoutPage />} />
                <Route path="/webinars/:webinarId/chat" element={<WebinarChatPage />} />
                <Route path="/webinars/library" element={<WebinarLibraryPage />} />
                <Route path="/webinars/series" element={<WebinarSeriesPage />} />
                <Route path="/webinars/:webinarId/donations" element={<WebinarDonationsPage />} />
                <Route path="/webinars/purchases" element={<WebinarPurchasesPage />} />
                <Route path="/webinars/:webinarId/analytics" element={<WebinarAnalyticsPage />} />
                <Route path="/webinars/:webinarId/settings" element={<WebinarSettingsPage />} />

                {/* Media Center */}
                <Route path="/media" element={<MediaHomePage />} />
                <Route path="/media/reels" element={<ReelsDiscoveryPage />} />
                <Route path="/media/reels/:reelId" element={<ReelsOverlayPage />} />
                <Route path="/media/reels/studio" element={<ReelsEditingStudioPage />} />
                <Route path="/media/videos" element={<VideoDiscoveryPage />} />
                <Route path="/media/videos/:videoId" element={<VideoPlayerDetailPage />} />
                <Route path="/media/videos/upload" element={<VideoUploadStudioPage />} />
                <Route path="/media/videos/studio" element={<VideoStudioPage />} />
                <Route path="/media/videos/studio/:videoId" element={<VideoStudioPage />} />
                <Route path="/media/creators" element={<CreatorDiscoveryPage />} />
                <Route path="/media/analytics" element={<MediaAnalyticsPage />} />
                <Route path="/media/library" element={<MediaLibraryPage />} />
                <Route path="/media/viewer" element={<MediaViewerPage />} />

                {/* Creation Studio */}
                <Route path="/creation-studio" element={<CreationStudioPage />} />
                <Route path="/creation-studio/drafts" element={<StudioDraftsPage />} />
                <Route path="/creation-studio/scheduled" element={<ScheduledContentPage />} />
                <Route path="/creation-studio/assets" element={<AssetLibraryPage />} />
                <Route path="/creation-studio/reel-builder" element={<ReelBuilderPage />} />
                <Route path="/creation-studio/analytics" element={<StudioAnalyticsPage />} />
                <Route path="/creation-studio/publish-review" element={<PublishReviewPage />} />

                {/* Groups */}
                <Route path="/groups" element={<GroupsHubPage />} />
                <Route path="/groups/:groupId" element={<GroupDetailPage />} />
                <Route path="/groups/:groupId/feed" element={<GroupFeedPage />} />
                <Route path="/groups/:groupId/members" element={<GroupMembersPage />} />
                <Route path="/groups/:groupId/files" element={<GroupFilesPage />} />
                <Route path="/groups/:groupId/events" element={<GroupEventsPage />} />
                <Route path="/groups/:groupId/moderation" element={<GroupModerationPage />} />
                <Route path="/groups/:groupId/join-approval" element={<GroupJoinApprovalPage />} />
                <Route path="/groups/:groupId/analytics" element={<GroupAnalyticsPage />} />
                {/* Podcasts */}
                <Route path="/podcasts" element={<PodcastDiscoveryPage />} />
                <Route path="/podcasts/show/:showId" element={<PodcastShowDetailPage />} />
                <Route path="/podcasts/player" element={<PodcastPlayerPage />} />
                <Route path="/podcasts/library" element={<PodcastLibraryPage />} />
                <Route path="/podcasts/studio" element={<PodcastCreatorStudioPage />} />
                <Route path="/podcasts/legacy" element={<PodcastsPage />} />
                <Route path="/podcasts/episode/:episodeId" element={<PodcastEpisodeDetailPage />} />
                <Route path="/podcasts/queue" element={<PodcastQueuePage />} />
                <Route path="/podcasts/series" element={<PodcastSeriesPage />} />
                <Route path="/podcasts/purchases" element={<PodcastPurchasesPage />} />
                <Route path="/podcasts/subscriptions" element={<PodcastSubscriptionsPage />} />
                <Route path="/podcasts/donations" element={<PodcastDonationsPage />} />
                <Route path="/podcasts/recorder" element={<PodcastRecorderPage />} />
                <Route path="/podcasts/analytics" element={<PodcastAnalyticsPage />} />
                <Route path="/podcasts/host/:hostId" element={<PodcastHostProfilePage />} />
                <Route path="/podcasts/episode/:episodeId/comments" element={<PodcastCommentsPage />} />

                {/* Route Aliases — redirect orphaned links */}
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/messages" element={<InboxPage />} />
                <Route path="/create/post" element={<CreationStudioPage />} />
                
                <Route path="/interactive" element={<MediaHomePage />} />
                <Route path="/recruiter/talent-search" element={<HirePageWrapper label="Talent"><RecruiterTalentSearchPage /></HirePageWrapper>} />
                {/* AI Tools */}
                <Route path="/analytics" element={<GlobalAnalyticsPage />} />
                <Route path="/purchases" element={<PurchasesPage />} />
                <Route path="/donations" element={<DonationsPage />} />
                <Route path="/pages" element={<PagesManagementPage />} />
                <Route path="/settings/integrations" element={<IntegrationsSettingsPage />} />

                {/* Experience Launchpad */}
                <Route path="/launchpad" element={<LaunchpadHomePage />} />
                <Route path="/launchpad/discover" element={<LaunchpadDiscoverPage />} />
                <Route path="/launchpad/opportunities" element={<LaunchpadOpportunitiesPage />} />
                <Route path="/launchpad/pathways" element={<LaunchpadPathwaysPage />} />
                <Route path="/launchpad/challenges" element={<LaunchpadChallengesPage />} />
                <Route path="/launchpad/applications" element={<LaunchpadApplicationsPage />} />
                <Route path="/launchpad/events" element={<LaunchpadEventsPage />} />
                <Route path="/launchpad/enterprise" element={<LaunchpadEnterprisePage />} />
                <Route path="/launchpad/saved" element={<LaunchpadSavedPage />} />
                <Route path="/launchpad/jobs" element={<LaunchpadJobsPage />} />
                <Route path="/launchpad/hosts" element={<LaunchpadHostsPage />} />
                <Route path="/launchpad/early-career" element={<EarlyCareerPage />} />
                <Route path="/launchpad/graduate" element={<GraduateOpportunitiesPage />} />
                <Route path="/launchpad/school-leaver" element={<SchoolLeaverPage />} />
                <Route path="/launchpad/career-changer" element={<CareerChangerPage />} />
                <Route path="/launchpad/projects" element={<ExperienceProjectsPage />} />
                <Route path="/launchpad/mentors" element={<MentorMatchingPage />} />
                <Route path="/launchpad/sessions" element={<MentorSessionsPage />} />
                <Route path="/launchpad/learning" element={<LearningPathsPage />} />
                <Route path="/launchpad/portfolio" element={<PortfolioBuilderPage />} />
                <Route path="/launchpad/badges" element={<BadgesVerificationPage />} />
                <Route path="/launchpad/community" element={<LaunchpadCommunityPage />} />
                <Route path="/launchpad/analytics" element={<LaunchpadAnalyticsPage />} />
                <Route path="/launchpad/employer" element={<EmployerPartnerPage />} />
                <Route path="/launchpad/settings" element={<LaunchpadSettingsPage />} />
                <Route path="/launchpad/progress" element={<LaunchpadProgressTrackerPage />} />

                {/* Service Management */}
                <Route path="/services/browse" element={<ServicesBrowsePage />} />
                <Route path="/services/:serviceId/detail" element={<ServiceDetailPageFull />} />
                <Route path="/services/listing/builder" element={<ServiceListingBuilderPageFull />} />
                <Route path="/services/packages/builder" element={<ServicePackagesBuilderPage />} />
                <Route path="/services/availability" element={<ServiceAvailabilityPage />} />
                <Route path="/services/:serviceId/book" element={<ServiceBookingPage />} />
                <Route path="/services/orders" element={<ServiceOrdersCenterPage />} />
                <Route path="/services/orders/:orderId/delivery" element={<ServiceDeliveryPage />} />
                <Route path="/services/analytics" element={<ServiceAnalyticsPage />} />
                <Route path="/services/promotions" element={<ServicePromotionsPage />} />
              </Route>

              {/* AI Tools — Dedicated Shell */}
              <Route element={<AIShell />}>
                <Route path="/ai" element={<AIToolsHubPage />} />
                <Route path="/ai/chat" element={<AIChatWorkspacePage />} />
                <Route path="/ai/writer" element={<AIWriterPage />} />
                <Route path="/ai/image" element={<AIImageStudioPage />} />
                <Route path="/ai/video" element={<AIVideoStudioPage />} />
                <Route path="/ai/proposal" element={<AIProposalHelperPage />} />
                <Route path="/ai/jd" element={<AIJDHelperPage />} />
                <Route path="/ai/brief" element={<AIBriefHelperPage />} />
                <Route path="/ai/outreach" element={<AIOutreachAssistantPage />} />
                <Route path="/ai/recruiter" element={<AIRecruiterAssistantPage />} />
                <Route path="/ai/support" element={<AISupportSummarizerPage />} />
                <Route path="/ai/analytics" element={<AIAnalyticsAssistantPage />} />
                <Route path="/ai/prompts" element={<AIPromptLibraryPage />} />
                <Route path="/ai/history" element={<AIHistoryPage />} />
                <Route path="/ai/billing" element={<AIBillingPage />} />
                <Route path="/ai/byok" element={<AIBYOKPage />} />
                <Route path="/ai/settings" element={<AISettingsPage />} />
              </Route>

              {/* Dashboard Shell */}
              <Route element={<DashboardShell />}>
                <Route path="/dashboard" element={<RoleDashboardRouter />} />
                <Route path="/dashboard/overview" element={<RoleDashboardRouter />} />
                <Route path="/dashboard/activity" element={<DashboardActivityPage />} />
                <Route path="/dashboard/saved" element={<DashboardSavedPage />} />
                <Route path="/dashboard/orders" element={<DashboardOrdersPage />} />
                <Route path="/dashboard/projects" element={<DashboardProjectsPage />} />
                <Route path="/dashboard/applications" element={<DashboardApplicationsPage />} />
                <Route path="/dashboard/bookings" element={<DashboardBookingsPage />} />
                <Route path="/dashboard/media" element={<DashboardMediaLibraryPage />} />
                <Route path="/dashboard/billing" element={<DashboardBillingPage />} />
                <Route path="/dashboard/support" element={<DashboardSupportPage />} />
                <Route path="/dashboard/settings" element={<DashboardSettingsPage />} />
                <Route path="/dashboard/professional" element={<ProfessionalDashboardPage />} />
                <Route path="/dashboard/work-queue" element={<ProWorkQueuePage />} />
                <Route path="/dashboard/gigs" element={<ProGigsServicesPage />} />
                <Route path="/dashboard/earnings" element={<ProEarningsPage />} />
                <Route path="/dashboard/profile" element={<ProPerformancePage />} />
                <Route path="/dashboard/analytics" element={<ProAnalyticsPage />} />
                <Route path="/dashboard/content" element={<ProContentMediaPage />} />
                <Route path="/dashboard/pro-orders" element={<ProOrdersPage />} />
                <Route path="/dashboard/pro-projects" element={<ProProjectsProposalsPage />} />
                <Route path="/dashboard/pro-bookings" element={<ProBookingsPage />} />
                <Route path="/dashboard/pro-billing" element={<ProCreditsBillingPage />} />
                <Route path="/dashboard/pro-settings" element={<ProSettingsPage />} />
                <Route path="/dashboard/hiring" element={<EntHiringOpsPage />} />
                <Route path="/dashboard/procurement" element={<EntProjectsProcurementPage />} />
                <Route path="/dashboard/vendors" element={<EntVendorsServicesPage />} />
                <Route path="/dashboard/campaigns" element={<EntCampaignsGrowthPage />} />
                <Route path="/dashboard/spend" element={<EntSpendApprovalsPage />} />
                <Route path="/dashboard/team" element={<EntTeamActivityPage />} />
                <Route path="/dashboard/connect" element={<EntEnterpriseConnectPage />} />
                <Route path="/dashboard/risk" element={<EntSupportRiskPage />} />
                <Route path="/dashboard/ent-settings" element={<EntSettingsSeatsPage />} />
                <Route path="/dashboard/client" element={<ClientDashboardPage />} />
                <Route path="/dashboard/recruiter" element={<RecruiterDashboardPage />} />
                <Route path="/dashboard/*" element={<RoleDashboardRouter />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </WorkspaceProvider>
      </RoleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
