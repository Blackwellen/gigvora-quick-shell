import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../core/api_client.dart';

class ShellBootstrap {
  final List<Org> orgs;
  final List<SavedView> savedViews;
  final List<RecentItem> recents;
  final ShellPrefs prefs;
  ShellBootstrap({required this.orgs, required this.savedViews, required this.recents, required this.prefs});

  factory ShellBootstrap.fromJson(Map<String, dynamic> j) => ShellBootstrap(
    orgs: (j['orgs'] as List? ?? []).map((e) => Org.fromJson(e)).toList(),
    savedViews: (j['savedViews'] as List? ?? []).map((e) => SavedView.fromJson(e)).toList(),
    recents: (j['recents'] as List? ?? []).map((e) => RecentItem.fromJson(e)).toList(),
    prefs: ShellPrefs.fromJson((j['prefs'] as Map?)?.cast<String, dynamic>() ?? const {}),
  );

  factory ShellBootstrap.empty() => ShellBootstrap(
    orgs: const [], savedViews: const [], recents: const [],
    prefs: ShellPrefs(activeRole: 'user', activeOrgId: null, sidebarCollapsed: false, rightRailOpen: true),
  );
}

class Org {
  final String id, slug, name, plan, role; final String? logoUrl;
  Org({required this.id, required this.slug, required this.name, required this.plan, required this.role, this.logoUrl});
  factory Org.fromJson(Map j) => Org(
    id: j['id'], slug: j['slug'] ?? '', name: j['name'], plan: j['plan'] ?? 'free',
    role: j['role'] ?? 'member', logoUrl: j['logoUrl']);
}

class SavedView {
  final String id, label, route; final bool pinned;
  SavedView({required this.id, required this.label, required this.route, required this.pinned});
  factory SavedView.fromJson(Map j) => SavedView(
    id: j['id'], label: j['label'], route: j['route'], pinned: j['pinned'] ?? false);
}

class RecentItem {
  final String id, kind, label, route, visitedAt;
  RecentItem({required this.id, required this.kind, required this.label, required this.route, required this.visitedAt});
  factory RecentItem.fromJson(Map j) => RecentItem(
    id: j['id'], kind: j['kind'], label: j['label'], route: j['route'], visitedAt: j['visitedAt'] ?? '');
}

class ShellPrefs {
  final String activeRole; final String? activeOrgId;
  final bool sidebarCollapsed, rightRailOpen;
  ShellPrefs({required this.activeRole, required this.activeOrgId, required this.sidebarCollapsed, required this.rightRailOpen});
  factory ShellPrefs.fromJson(Map j) => ShellPrefs(
    activeRole: j['activeRole'] ?? 'user',
    activeOrgId: j['activeOrgId'],
    sidebarCollapsed: j['sidebarCollapsed'] ?? false,
    rightRailOpen: j['rightRailOpen'] ?? true);
}

final shellBootstrapProvider = FutureProvider<ShellBootstrap>((ref) async {
  final dio = ref.watch(apiClientProvider);
  try {
    final r = await dio.get('/api/v1/shell/bootstrap');
    return ShellBootstrap.fromJson(Map<String, dynamic>.from(r.data));
  } on DioException {
    return ShellBootstrap.empty();
  }
});
