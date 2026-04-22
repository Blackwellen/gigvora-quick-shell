/// Enterprise Connect mobile screen — sticky KPI strip + tabbed views
/// (Directory · Partners · Procurement · Intros · Rooms · Events · Startups).
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'enterprise_connect_api.dart';

final _ecOverviewProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) =>
    ref.read(enterpriseConnectApiProvider).overview());
final _ecDirectoryProvider = FutureProvider.autoDispose<List<dynamic>>((ref) =>
    ref.read(enterpriseConnectApiProvider).directory());
final _ecStartupsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) =>
    ref.read(enterpriseConnectApiProvider).startups());
final _ecPartnersProvider = FutureProvider.autoDispose<List<dynamic>>((ref) =>
    ref.read(enterpriseConnectApiProvider).partners());
final _ecBriefsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) =>
    ref.read(enterpriseConnectApiProvider).briefs(scope: 'discover'));
final _ecIntrosProvider = FutureProvider.autoDispose<List<dynamic>>((ref) =>
    ref.read(enterpriseConnectApiProvider).intros());
final _ecRoomsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) =>
    ref.read(enterpriseConnectApiProvider).rooms());
final _ecEventsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) =>
    ref.read(enterpriseConnectApiProvider).events());

class EnterpriseConnectScreen extends ConsumerWidget {
  const EnterpriseConnectScreen({super.key});

  @override
  Widget build(BuildContext ctx, WidgetRef ref) {
    final overview = ref.watch(_ecOverviewProvider);
    return DefaultTabController(
      length: 7,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Enterprise Connect'),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Directory'),
              Tab(text: 'Partners'),
              Tab(text: 'Procurement'),
              Tab(text: 'Intros'),
              Tab(text: 'Rooms'),
              Tab(text: 'Events'),
            ],
          ),
        ),
        body: Column(children: [
          overview.when(
            data: (d) => _Kpis(d),
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => _ErrorBar(message: '$e', onRetry: () => ref.invalidate(_ecOverviewProvider)),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _OverviewTab(),
                _ListTab(provider: _ecDirectoryProvider, titleKey: 'display_name', subtitleKey: 'tagline'),
                _ListTab(provider: _ecPartnersProvider, titleKey: 'b_name', subtitleKey: 'relation_kind'),
                _ListTab(provider: _ecBriefsProvider, titleKey: 'title', subtitleKey: 'category'),
                _ListTab(provider: _ecIntrosProvider, titleKey: 'reason', subtitleKey: 'status'),
                _ListTab(provider: _ecRoomsProvider, titleKey: 'title', subtitleKey: 'kind'),
                _ListTab(provider: _ecEventsProvider, titleKey: 'title', subtitleKey: 'format'),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}

class _Kpis extends StatelessWidget {
  const _Kpis(this.d);
  final Map<String, dynamic> d;
  @override
  Widget build(BuildContext ctx) {
    final c = (d['counts'] as Map?) ?? const {};
    Widget chip(String label, dynamic v) => Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      child: Chip(label: Text('$label: ${v ?? 0}')),
    );
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(children: [
        chip('Partners', c['partners']), chip('Briefs', c['briefs']),
        chip('Intros', c['intros']), chip('Rooms', c['rooms']), chip('Events', c['events']),
      ]),
    );
  }
}

class _OverviewTab extends ConsumerWidget {
  @override
  Widget build(BuildContext ctx, WidgetRef ref) {
    final s = ref.watch(_ecStartupsProvider);
    return s.when(
      data: (rows) {
        if (rows.isEmpty) return const _EmptyState(text: 'No startups featured yet.');
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(_ecStartupsProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: rows.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final r = rows[i] as Map<String, dynamic>;
              return Card(child: ListTile(
                title: Text((r['display_name'] ?? '') as String),
                subtitle: Text((r['pitch_one_liner'] ?? r['tagline'] ?? '') as String),
                trailing: r['featured'] == true ? const Icon(Icons.star, size: 18) : null,
              ));
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorBar(message: '$e', onRetry: () => ref.invalidate(_ecStartupsProvider)),
    );
  }
}

class _ListTab extends ConsumerWidget {
  const _ListTab({required this.provider, required this.titleKey, required this.subtitleKey});
  final FutureProvider<List<dynamic>> provider;
  final String titleKey;
  final String subtitleKey;
  @override
  Widget build(BuildContext ctx, WidgetRef ref) {
    final v = ref.watch(provider);
    return v.when(
      data: (rows) {
        if (rows.isEmpty) return const _EmptyState(text: 'Nothing yet.');
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(provider),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: rows.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final r = rows[i] as Map<String, dynamic>;
              return ListTile(
                title: Text((r[titleKey] ?? '') as String),
                subtitle: Text((r[subtitleKey] ?? '') as String),
              );
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorBar(message: '$e', onRetry: () => ref.invalidate(provider)),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.text});
  final String text;
  @override
  Widget build(BuildContext ctx) => Center(child: Padding(
    padding: const EdgeInsets.all(24),
    child: Text(text, textAlign: TextAlign.center),
  ));
}

class _ErrorBar extends StatelessWidget {
  const _ErrorBar({required this.message, required this.onRetry});
  final String message; final VoidCallback onRetry;
  @override
  Widget build(BuildContext ctx) => Material(
    color: Theme.of(ctx).colorScheme.errorContainer,
    child: ListTile(
      leading: const Icon(Icons.error_outline),
      title: Text(message),
      trailing: TextButton(onPressed: onRetry, child: const Text('Retry')),
    ),
  );
}
