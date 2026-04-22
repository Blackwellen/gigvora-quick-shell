import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'resource_planning_utilization_api.dart';

/// Domain 56 — Resource planning, utilization & assignments mobile screen.
///
/// Mobile-specific affordances:
///   • Horizontal KPI tiles (active resources, projects, assignments, avg util).
///   • Utilization rows colour-coded by ratio (green/amber/red).
///   • Assignment cards with swipe-right to confirm, swipe-left to cancel
///     (reason bottom sheet).
class ResourcePlanningUtilizationScreen extends ConsumerStatefulWidget {
  const ResourcePlanningUtilizationScreen({super.key});
  @override
  ConsumerState<ResourcePlanningUtilizationScreen> createState() => _State();
}

class _State extends ConsumerState<ResourcePlanningUtilizationScreen> {
  Map<String, dynamic>? _overview;
  Map<String, dynamic>? _assignments;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = ResourcePlanningUtilizationApi(ref.read(apiClientProvider));
      _overview = await api.overview();
      _assignments = await api.assignments(status: 'confirmed');
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<String?> _promptReason(String label) async {
    final ctrl = TextEditingController();
    return showModalBottomSheet<String>(
      context: context, isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 16, right: 16, top: 16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(label),
          TextField(controller: ctrl, autofocus: true),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel'))),
            const SizedBox(width: 8),
            Expanded(child: FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Confirm'))),
          ]),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }

  Future<void> _activate(String id) async {
    try {
      await ResourcePlanningUtilizationApi(ref.read(apiClientProvider)).transitionAssignment(id, 'active');
      await _refresh();
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'))); }
  }

  Future<void> _cancel(String id) async {
    final reason = await _promptReason('Reason for cancellation');
    if (reason == null || reason.isEmpty) return;
    try {
      await ResourcePlanningUtilizationApi(ref.read(apiClientProvider)).transitionAssignment(id, 'cancelled', reason: reason);
      await _refresh();
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'))); }
  }

  Color _utilColor(double ratio) {
    if (ratio > 1.0) return Colors.red.shade400;
    if (ratio < 0.6) return Colors.amber.shade400;
    return Colors.green.shade400;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Resource planning')),
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
    final util = (_overview?['utilization'] as List?) ?? [];
    final asn = (_assignments?['items'] as List?) ?? [];

    return ListView(padding: const EdgeInsets.all(16), children: [
      SizedBox(height: 92, child: ListView(scrollDirection: Axis.horizontal, children: [
        _kpi('Resources', '${kpis['activeResources'] ?? 0}'),
        _kpi('Projects', '${kpis['activeProjects'] ?? 0}'),
        _kpi('Assignments', '${kpis['assignmentsInWindow'] ?? 0}'),
        _kpi('Avg util', '${kpis['avgUtilizationPct'] ?? 0}%'),
      ])),
      const SizedBox(height: 16),
      const Text('Utilization (next 4 weeks)', style: TextStyle(fontWeight: FontWeight.w600)),
      ...util.map((u) {
        final ratio = double.tryParse(u['utilization_ratio']?.toString() ?? '0') ?? 0;
        return Card(child: ListTile(
          leading: CircleAvatar(backgroundColor: _utilColor(ratio), child: Text('${(ratio * 100).round()}%', style: const TextStyle(fontSize: 12, color: Colors.white))),
          title: Text(u['full_name']?.toString() ?? ''),
          subtitle: Text('${u['team'] ?? ''} • booked ${u['booked_hours']}h / ${u['capacity_hours']}h'),
        ));
      }),
      const SizedBox(height: 16),
      const Text('Confirmed assignments', style: TextStyle(fontWeight: FontWeight.w600)),
      ...asn.map((a) => Dismissible(
        key: ValueKey(a['id']),
        background: Container(color: Colors.green.shade100, alignment: Alignment.centerLeft,
          padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Activate')),
        secondaryBackground: Container(color: Colors.red.shade100, alignment: Alignment.centerRight,
          padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Cancel')),
        confirmDismiss: (dir) async {
          if (dir == DismissDirection.startToEnd) await _activate(a['id'] as String);
          else await _cancel(a['id'] as String);
          return false;
        },
        child: Card(child: ListTile(
          title: Text('${a['role'] ?? 'Assignment'} • ${a['hoursPerWeek'] ?? a['hours_per_week']}h/wk'),
          subtitle: Text('${a['startDate'] ?? a['start_date']} → ${a['endDate'] ?? a['end_date']} • ${a['status']}'),
        )),
      )),
    ]);
  }

  Widget _kpi(String label, String value) => Container(
        width: 130, margin: const EdgeInsets.only(right: 12), padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        ]),
      );
}
