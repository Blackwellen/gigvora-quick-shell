import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'ads_manager_builder_api.dart';

/// Domain 60 — Ads Manager mobile screen.
///
/// Mobile affordances:
///   • Sticky KPI header (active / in_review / spent / budget).
///   • Tabs: Campaigns | Creatives.
///   • Tap a campaign → bottom sheet with pause/resume + send for review.
class AdsManagerBuilderScreen extends ConsumerStatefulWidget {
  const AdsManagerBuilderScreen({super.key});
  @override
  ConsumerState<AdsManagerBuilderScreen> createState() => _State();
}

class _State extends ConsumerState<AdsManagerBuilderScreen> {
  Map<String, dynamic>? _overview;
  List<dynamic> _campaigns = const [];
  List<dynamic> _creatives = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = AdsManagerBuilderApi(ref.read(apiClientProvider));
      _overview = await api.overview();
      _campaigns = await api.campaigns();
      _creatives = await api.creatives();
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _campaignSheet(Map<String, dynamic> c) async {
    final api = AdsManagerBuilderApi(ref.read(apiClientProvider));
    final status = c['status']?.toString() ?? '';
    await showModalBottomSheet(context: context, isScrollControlled: true, builder: (ctx) => Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(c['name']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
        Text('${c['objective']} • $status'),
        const SizedBox(height: 12),
        if (status == 'draft' || status == 'rejected')
          FilledButton(onPressed: () async {
            await api.transitionCampaign(c['id'] as String, 'in_review');
            if (mounted) { Navigator.pop(ctx); await _refresh(); }
          }, child: const Text('Send for review')),
        if (status == 'active')
          FilledButton(onPressed: () async {
            await api.transitionCampaign(c['id'] as String, 'paused', reason: 'Paused from mobile');
            if (mounted) { Navigator.pop(ctx); await _refresh(); }
          }, child: const Text('Pause campaign')),
        if (status == 'paused' || status == 'approved')
          FilledButton(onPressed: () async {
            await api.transitionCampaign(c['id'] as String, 'active');
            if (mounted) { Navigator.pop(ctx); await _refresh(); }
          }, child: const Text('Resume / activate')),
      ]),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final kpis = (_overview?['kpis'] as Map?) ?? const {};
    return DefaultTabController(length: 2, child: Scaffold(
      appBar: AppBar(title: const Text('Ads Manager'), bottom: const TabBar(tabs: [
        Tab(text: 'Campaigns'), Tab(text: 'Creatives'),
      ])),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
          ? Center(child: Text('Error: $_error'))
          : Column(children: [
              Container(margin: const EdgeInsets.all(16), padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(16)),
                child: Row(children: [
                  Expanded(child: _stat('Active', '${kpis['active'] ?? 0}')),
                  Expanded(child: _stat('In review', '${kpis['inReview'] ?? 0}')),
                  Expanded(child: _stat('Spent', '£${((kpis['spentMinor'] ?? 0) as int)/100}')),
                  Expanded(child: _stat('Budget', '£${((kpis['budgetMinor'] ?? 0) as int)/100}')),
                ])),
              Expanded(child: TabBarView(children: [
                RefreshIndicator(onRefresh: _refresh, child: ListView(children: _campaigns.map((c) {
                  final m = Map<String, dynamic>.from(c as Map);
                  return ListTile(title: Text(m['name']?.toString() ?? ''),
                    subtitle: Text('${m['objective']} • ${m['status']}'),
                    trailing: Text('£${((m['spentMinor'] ?? 0) as int)/100}'),
                    onTap: () => _campaignSheet(m));
                }).toList())),
                RefreshIndicator(onRefresh: _refresh, child: ListView(children: _creatives.map((c) {
                  final m = Map<String, dynamic>.from(c as Map);
                  return ListTile(
                    leading: m['thumbnailUrl'] != null
                      ? Image.network(m['thumbnailUrl'] as String, width: 56, height: 56, fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(Icons.image))
                      : const Icon(Icons.image),
                    title: Text(m['name']?.toString() ?? ''),
                    subtitle: Text('${m['format']} • ${m['status']}'),
                  );
                }).toList())),
              ])),
            ]),
    ));
  }

  Widget _stat(String l, String v) => Column(children: [
    Text(l, style: const TextStyle(fontSize: 12, color: Colors.black54)),
    const SizedBox(height: 4),
    Text(v, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
  ]);
}
