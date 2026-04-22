import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'recruiter_dashboard_api.dart';

/// Domain 51 — Recruiter dashboard mobile screen.
///
/// Mobile-specific affordances:
///   • Horizontally scrollable KPI tiles replace the desktop left rail.
///   • Pipelines are vertically stacked cards with tap-to-open detail sheet.
///   • Tasks support swipe-right (complete) and swipe-left (dismiss).
///   • Pipeline transitions use a bottom sheet selector.
class RecruiterDashboardScreen extends ConsumerStatefulWidget {
  const RecruiterDashboardScreen({super.key});
  @override
  ConsumerState<RecruiterDashboardScreen> createState() => _RecruiterDashboardScreenState();
}

class _RecruiterDashboardScreenState extends ConsumerState<RecruiterDashboardScreen> {
  Map<String, dynamic>? _overview;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = RecruiterDashboardApi(ref.read(apiClientProvider));
      final data = await api.overview();
      setState(() { _overview = data; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _transitionTask(String id, String status) async {
    final api = RecruiterDashboardApi(ref.read(apiClientProvider));
    try {
      await api.transitionTask(id, status);
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _transitionPipeline(String id, String status) async {
    final api = RecruiterDashboardApi(ref.read(apiClientProvider));
    try {
      await api.transitionPipeline(id, status);
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Recruiter dashboard')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(children: [Padding(padding: const EdgeInsets.all(24), child: Text('Error: $_error'))])
                : _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    final kpis = (_overview?['kpis'] as Map?) ?? {};
    final pipelines = (_overview?['pipelines'] as List?) ?? [];
    final tasks = (_overview?['tasks'] as List?) ?? [];
    final funnel = (_overview?['funnel'] as Map?) ?? {};
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SizedBox(
          height: 92,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _kpi('Active pipes', '${kpis['activePipelines'] ?? 0}'),
              _kpi('Active cands', '${kpis['totalActiveCandidates'] ?? 0}'),
              _kpi('Hired', '${kpis['totalHired'] ?? 0}'),
              _kpi('Reply %', '${kpis['responseRate'] ?? 0}'),
              _kpi('Avg fill', '${kpis['avgDaysToFill'] ?? 0}d'),
              _kpi('Open tasks', '${kpis['openTasks'] ?? 0}'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('Funnel', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Card(child: Padding(
          padding: const EdgeInsets.all(12),
          child: Wrap(spacing: 12, runSpacing: 8, children: funnel.entries.map((e) {
            final v = (e.value as Map?) ?? {};
            return Chip(label: Text('${e.key}: ${v['count'] ?? 0}'));
          }).toList()),
        )),
        const SizedBox(height: 16),
        const Text('Pipelines', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        ...pipelines.map((p) => Card(child: ListTile(
              title: Text(p['name']?.toString() ?? ''),
              subtitle: Text('${p['activeCandidates'] ?? 0} active • ${p['status']}'),
              trailing: PopupMenuButton<String>(
                onSelected: (s) => _transitionPipeline(p['id'] as String, s),
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'active', child: Text('Activate')),
                  PopupMenuItem(value: 'paused', child: Text('Pause')),
                  PopupMenuItem(value: 'archived', child: Text('Archive')),
                ],
              ),
            ))),
        const SizedBox(height: 16),
        const Text('Tasks', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        ...tasks.map((t) => Dismissible(
              key: ValueKey(t['id']),
              background: Container(color: Colors.green.shade100, alignment: Alignment.centerLeft, padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Complete')),
              secondaryBackground: Container(color: Colors.red.shade100, alignment: Alignment.centerRight, padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Dismiss')),
              confirmDismiss: (dir) async {
                if (dir == DismissDirection.startToEnd) await _transitionTask(t['id'] as String, 'done');
                if (dir == DismissDirection.endToStart) await _transitionTask(t['id'] as String, 'dismissed');
                return false;
              },
              child: Card(child: ListTile(
                title: Text(t['title']?.toString() ?? ''),
                subtitle: Text('${t['kind']} • ${t['priority']}'),
                trailing: Text(t['status']?.toString() ?? ''),
              )),
            )),
      ],
    );
  }

  Widget _kpi(String label, String value) {
    return Container(
      width: 130,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(16)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}
