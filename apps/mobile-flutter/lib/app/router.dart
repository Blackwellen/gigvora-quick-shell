import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/shell/shell_repository.dart';
import '../features/feed/feed_list_screen.dart';
import '../features/feed/feed_detail_screen.dart';
import '../features/feed/feed_compose_screen.dart';
import '../features/network/network_home_screen.dart';
import '../features/profiles/profile_view_screen.dart';
import '../features/profiles/profile_edit_screen.dart';
import '../features/profiles/profile_directory_screen.dart';
import '../features/companies/companies_list_screen.dart';
import '../features/companies/company_detail_screen.dart';
import '../features/companies/company_edit_screen.dart';
import '../features/marketing/marketing_pages_list_screen.dart';
import '../features/marketing/marketing_page_detail_screen.dart';
import '../features/marketing/leads_inbox_screen.dart';
import '../features/identity/auth_screens.dart';
import '../features/identity/account_security_screens.dart';
import '../features/entitlements/plans_list_screen.dart';
import '../features/entitlements/current_plan_screen.dart';
import '../features/search/search_screen.dart';
import '../features/overlays/overlays_screens.dart';
import '../features/notifications/notifications_screens.dart';
import '../features/settings/settings_screens.dart';
import '../features/groups/groups_screens.dart';
import '../features/events/events_screens.dart';
import '../features/agency/agency_screens.dart';
import '../features/calendar/calendar_screens.dart';
import '../features/booking/booking_list_screen.dart';
import '../features/calls/calls_list_screen.dart';
import '../features/contracts/contracts_screens.dart';
import '../features/recruiter_pro/recruiter_pro_screens.dart';
import '../features/inbox/inbox_screens.dart' as inbox_v2;
import '../features/integrations/integrations_screens.dart';
import '../features/webhooks/webhooks_screens.dart';
import '../features/identity_v2/identity_screens.dart';
import '../features/entitlements_v2/entitlements_screens.dart';
import '../features/search_v2/search_screens.dart' as search_v2;
import '../features/auth_v2/auth_screens.dart' as auth_v2;
import '../features/overlays_v2/overlays_screens.dart';
import '../features/backfill_batch_11/backfill_batch_11_screens.dart' as bf11;
import '../features/backfill_batch_12/backfill_batch_12_screens.dart' as bf12;
import '../features/backfill_batch_13/backfill_batch_13_screens.dart' as bf13;
import '../features/backfill_batch_14/backfill_batch_14_screens.dart' as bf14;

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/feed/compose', builder: (_, __) => const FeedComposeScreen()),
      GoRoute(path: '/feed/:id', builder: (_, st) => FeedDetailScreen(postId: st.pathParameters['id']!)),
      GoRoute(path: '/profile/:id/edit', builder: (_, st) => ProfileEditScreen(identityId: st.pathParameters['id']!)),
      GoRoute(path: '/profile/:id', builder: (_, st) => ProfileViewScreen(identityId: st.pathParameters['id']!)),
      GoRoute(path: '/profiles', builder: (_, __) => const ProfileDirectoryScreen()),
      GoRoute(path: '/agencies', builder: (_, __) => const AgencyListScreen()),
      GoRoute(path: '/agencies/:id', builder: (_, st) => AgencyDetailScreen(idOrSlug: st.pathParameters['id']!)),
      GoRoute(path: '/calendar', builder: (_, __) => const CalendarAgendaScreen()),
      GoRoute(path: '/calendar/new', builder: (_, __) => const CalendarComposeScreen()),
      GoRoute(path: '/calendar/:id', builder: (_, st) => CalendarEventDetailScreen(eventId: st.pathParameters['id']!)),
      GoRoute(path: '/bookings', builder: (_, __) => const BookingListScreen()),
      GoRoute(path: '/bookings/new', builder: (_, __) => const BookingComposeScreen()),
      GoRoute(path: '/bookings/:id', builder: (_, st) => BookingDetailScreen(bookingId: st.pathParameters['id']!)),
      GoRoute(path: '/calls', builder: (_, __) => const CallsListScreen()),
      GoRoute(path: '/calls/new', builder: (_, __) => const CallComposeScreen()),
      GoRoute(path: '/calls/:id', builder: (_, st) => CallDetailScreen(callId: st.pathParameters['id']!)),
      GoRoute(path: '/company/:id/edit', builder: (_, st) => CompanyEditScreen(companyId: st.pathParameters['id']!)),
      GoRoute(path: '/company/:id', builder: (_, st) => CompanyDetailScreen(idOrSlug: st.pathParameters['id']!)),
      GoRoute(path: '/marketing/pages/:slug', builder: (_, st) => MarketingPageDetailScreen(slug: st.pathParameters['slug']!)),
      GoRoute(path: '/marketing/leads', builder: (_, __) => const LeadsInboxScreen()),
      GoRoute(path: '/auth/sign-in', builder: (_, __) => const SignInScreen()),
      GoRoute(path: '/auth/sign-up', builder: (_, __) => const SignUpScreen()),
      GoRoute(path: '/auth/mfa', builder: (_, __) => const MfaChallengeScreen()),
      GoRoute(path: '/auth/forgot', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(path: '/account/security', builder: (_, __) => const AccountSecurityScreen()),
      GoRoute(path: '/account/sessions', builder: (_, __) => const SessionsScreen()),
      GoRoute(path: '/billing/plans', builder: (_, __) => const PlansListScreen()),
      GoRoute(path: '/billing/current', builder: (_, __) => const CurrentPlanScreen()),
      GoRoute(path: '/billing/denials', builder: (_, __) => const DenialsScreen()),
      GoRoute(path: '/search', builder: (_, __) => const SearchScreen()),
      GoRoute(path: '/search/saved', builder: (_, __) => const SavedSearchesScreen()),
      GoRoute(path: '/search/palette', builder: (_, __) => const CommandPaletteScreen()),
      GoRoute(path: '/overlays', builder: (_, __) => const OverlaysInboxScreen()),
      GoRoute(path: '/overlays/workflows/:id', builder: (_, st) => WorkflowDetailScreen(id: st.pathParameters['id']!)),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsInboxScreen()),
      GoRoute(path: '/notifications/preferences', builder: (_, __) => const NotificationPreferencesScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      GoRoute(path: '/settings/connections', builder: (_, __) => const ConnectionsScreen()),
      GoRoute(path: '/settings/data-requests', builder: (_, __) => const DataRequestsScreen()),
      GoRoute(path: '/groups', builder: (_, __) => const GroupsListScreen()),
      GoRoute(path: '/groups/:id', builder: (_, st) => GroupDetailScreen(idOrSlug: st.pathParameters['id']!)),
      GoRoute(path: '/events', builder: (_, __) => const EventsListScreen()),
      GoRoute(path: '/events/:id', builder: (_, st) => EventDetailScreen(idOrSlug: st.pathParameters['id']!)),
      // Backfill batch — Contracts, Recruiter Pro, Inbox v2, Integrations, Webhooks
      GoRoute(path: '/contracts', builder: (_, __) => const ContractsListScreen()),
      GoRoute(path: '/contracts/:id', builder: (_, st) => SowDetailScreen(sowId: st.pathParameters['id']!)),
      GoRoute(path: '/hire/pipelines', builder: (_, __) => const RecruiterPipelinesScreen()),
      GoRoute(path: '/hire/pipelines/:id', builder: (_, st) => RecruiterPipelineDetailScreen(pipelineId: st.pathParameters['id']!)),
      GoRoute(path: '/inbox/threads', builder: (_, __) => const inbox_v2.InboxThreadsScreen()),
      GoRoute(path: '/inbox/threads/:id', builder: (_, st) => inbox_v2.InboxThreadDetailScreen(threadId: st.pathParameters['id']!)),
      GoRoute(path: '/integrations', builder: (_, __) => const IntegrationsListScreen()),
      GoRoute(path: '/integrations/:id', builder: (_, st) => IntegrationConnectionDetailScreen(connectionId: st.pathParameters['id']!)),
      GoRoute(path: '/webhooks', builder: (_, __) => const WebhooksListScreen()),
      GoRoute(path: '/webhooks/:id/deliveries', builder: (_, st) => WebhookDeliveriesScreen(endpointId: st.pathParameters['id']!)),
      // Backfill batch 10 — Identity, Entitlements, Search v2, Auth v2, Overlays v2
      GoRoute(path: '/identity/switch', builder: (_, __) => const IdentitySwitcherScreen()),
      GoRoute(path: '/identity/:id', builder: (_, st) => IdentityProfileScreen(identityId: st.pathParameters['id']!)),
      GoRoute(path: '/plans', builder: (_, __) => const PlansScreen()),
      GoRoute(path: '/entitlements', builder: (_, __) => const EntitlementsScreen()),
      GoRoute(path: '/search/v2', builder: (_, __) => const search_v2.GlobalSearchScreen()),
      GoRoute(path: '/commands', builder: (_, __) => const search_v2.CommandPaletteScreenV2()),
      GoRoute(path: '/auth/v2/sign-in', builder: (_, __) => const auth_v2.SignInScreenV2()),
      GoRoute(path: '/auth/v2/sessions', builder: (_, __) => const auth_v2.SessionsScreenV2()),
      GoRoute(path: '/auth/v2/mfa', builder: (_, __) => const auth_v2.MfaSetupScreen()),
      GoRoute(path: '/create', builder: (_, __) => const WizardLauncherScreen()),
      GoRoute(path: '/drafts', builder: (_, __) => const DraftsScreen()),
      // Backfill batch 11 — Live streaming, Payouts v2, Moderation, Referrals, Learning
      GoRoute(path: '/live', builder: (_, __) => const bf11.LiveStreamingScreen()),
      GoRoute(path: '/payouts/v2', builder: (_, __) => const bf11.PayoutsV2Screen()),
      GoRoute(path: '/moderation/queues', builder: (_, __) => const bf11.ModerationQueuesScreen()),
      GoRoute(path: '/referrals', builder: (_, __) => const bf11.ReferralsScreen()),
      GoRoute(path: '/learn', builder: (_, __) => const bf11.LearningPathsScreen()),
      // Backfill batch 12 — Notifications v2, Calendar v2
      GoRoute(path: '/notifications/v2', builder: (_, __) => const bf12.NotificationsV2Screen()),
      GoRoute(path: '/calendar/v2', builder: (_, __) => const bf12.CalendarV2Screen()),
      GoRoute(path: '/scheduling-links', builder: (_, __) => const bf12.SchedulingLinksScreen()),
      // Backfill batch 13 — Billing & Invoices, Tax & Compliance, File Storage
      GoRoute(path: '/billing/invoices', builder: (_, __) => const bf13.BillingInvoicesScreen()),
      GoRoute(path: '/tax/compliance', builder: (_, __) => const bf13.TaxComplianceScreen()),
      GoRoute(path: '/storage/files', builder: (_, __) => const bf13.FileStorageScreen()),
      // Backfill batch 14 — Analytics v2, Reporting, Audit Log, Webhooks, Integrations
      GoRoute(path: '/analytics/v2', builder: (_, __) => const bf14.AnalyticsV2Screen()),
      GoRoute(path: '/reporting', builder: (_, __) => const bf14.ReportingScreen()),
      GoRoute(path: '/audit-log', builder: (_, __) => const bf14.AuditLogScreen()),
      GoRoute(path: '/webhooks', builder: (_, __) => const bf14.WebhooksScreen()),
      GoRoute(path: '/integrations', builder: (_, __) => const bf14.IntegrationsScreen()),
      ShellRoute(
        builder: (ctx, state, child) => GigvoraShell(child: child),
        routes: [
          GoRoute(path: '/',         builder: (_, __) => const FeedListScreen()),
          GoRoute(path: '/feed',     builder: (_, __) => const FeedListScreen()),
          GoRoute(path: '/network',  builder: (_, __) => const NetworkHomeScreen()),
          GoRoute(path: '/companies',builder: (_, __) => const CompaniesListScreen()),
          GoRoute(path: '/marketing',builder: (_, __) => const MarketingPagesListScreen()),
          GoRoute(path: '/work',     builder: (_, __) => const WorkScreen()),
          GoRoute(path: '/inbox',    builder: (_, __) => const InboxScreen()),
          GoRoute(path: '/profile',  builder: (_, __) => const ProfileScreen()),
        ],
      ),
    ],
  );
});

class GigvoraShell extends ConsumerWidget {
  final Widget child;
  const GigvoraShell({super.key, required this.child});

  int _indexFor(String loc) =>
    loc.startsWith('/work') ? 1 :
    loc.startsWith('/inbox') ? 2 :
    loc.startsWith('/profile') ? 3 : 0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final boot = ref.watch(shellBootstrapProvider);
    final loc = GoRouterState.of(context).uri.path;
    final idx = _indexFor(loc);

    return Scaffold(
      body: child,
      drawer: const _MegaMenuDrawer(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
        onDestinationSelected: (i) {
          switch (i) {
            case 0: context.go('/feed'); break;
            case 1: context.go('/work'); break;
            case 2: context.go('/inbox'); break;
            case 3: context.go('/profile'); break;
          }
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined),    selectedIcon: Icon(Icons.home),    label: 'Feed'),
          NavigationDestination(icon: Icon(Icons.work_outline),     selectedIcon: Icon(Icons.work),    label: 'Work'),
          NavigationDestination(icon: Icon(Icons.inbox_outlined),   selectedIcon: Icon(Icons.inbox),   label: 'Inbox'),
          NavigationDestination(icon: Icon(Icons.person_outline),   selectedIcon: Icon(Icons.person),  label: 'Profile'),
        ],
      ),
    );
  }
}

class _MegaMenuDrawer extends StatelessWidget {
  const _MegaMenuDrawer();
  @override
  Widget build(BuildContext context) {
    final groups = const {
      'Discover': ['Feed', 'Network', 'Groups', 'Events', 'Media'],
      'Work':     ['Projects', 'Gigs', 'Services', 'Jobs', 'Bookings'],
      'Hire':     ['Hire Talent', 'Recruiter Pro', 'Enterprise Connect'],
      'AI':       ['AI Hub', 'Writer', 'Image Studio'],
    };
    return Drawer(
      child: ListView(
        children: groups.entries.expand((e) => [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Text(e.key, style: Theme.of(context).textTheme.labelLarge),
          ),
          ...e.value.map((label) => ListTile(
            dense: true,
            title: Text(label),
            onTap: () => Navigator.of(context).pop(),
          )),
        ]).toList(),
      ),
    );
  }
}

class WorkScreen extends StatelessWidget {
  const WorkScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(child: Text('Work hub')),
  );
}

class InboxScreen extends StatelessWidget {
  const InboxScreen({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(child: Text('Inbox')),
  );
}

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final boot = ref.watch(shellBootstrapProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: boot.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Offline')),
        data: (b) => ListView(children: [
          ListTile(title: Text('Active role: ${b.prefs.activeRole}')),
          ListTile(title: Text('Active org: ${b.prefs.activeOrgId ?? "—"}')),
          const Divider(),
          ...b.savedViews.map((v) => ListTile(
            leading: Icon(v.pinned ? Icons.push_pin : Icons.push_pin_outlined),
            title: Text(v.label),
            subtitle: Text(v.route),
          )),
        ]),
      ),
    );
  }
}
