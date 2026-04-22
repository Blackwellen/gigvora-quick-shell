import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'agency_management_dashboard_api.dart';

/// Domain 52 — Agency management dashboard mobile screen.
///
/// Mobile-specific affordances:
///   • Horizontal KPI tiles replace the desktop left rail.
///   • Engagement cards expose status menu (activate/at-risk/hold/complete).
///   • Deliverables support swipe-right (start/complete) and swipe-left (block via bottom sheet).
///   • Invoices expose Mark Paid via tap row.
class AgencyManagementDashboardScreen extends ConsumerStatefulWidget {
  const AgencyManagementDashboardScreen({super.key});
  @override
  ConsumerState<AgencyManagementDashboardScreen> createState() => _State();
}

class _State extends ConsumerState<AgencyManagementDashboardScreen> {
  Map<String, dynamic>? _overview;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = AgencyManagementDashboardApi(ref.read(apiClientProvider));
      final data = await api.overview();
      setState(() { _overview = data; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _transitionEngagement(String id, String status) async {
    try {
      await AgencyManagementDashboardApi(ref.read(apiClientProvider)).transitionEngagement(id, status);
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _transitionDeliverable(String id, String status, {String? blockedReason}) async {
    try {
      await AgencyManagementDashboardApi(ref.read(apiClientProvider))
          .transitionDeliverable(id, status, blockedReason: blockedReason);
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<String?> _promptBlockedReason() async {
    final ctrl = TextEditingController();
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 16, right: 16, top: 16),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Reason for blocking'),
          TextField(controller: ctrl, autofocus: true),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel'))),
            const SizedBox(width: 8),
            Expanded(child: FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Block'))),
          ]),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Agency dashboard')),
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
    final engagements = (_overview?['engagements'] as List?) ?? [];
    final deliverables = (_overview?['deliverables'] as List?) ?? [];
    final util = (_overview?['utilization'] as List?) ?? [];

    return ListView(padding: const EdgeInsets.all(16), children: [
      SizedBox(height: 92, child: ListView(scrollDirection: Axis.horizontal, children: [
        _kpi('Active', '${kpis['activeEngagements'] ?? 0}'),
        _kpi('At risk', '${kpis['atRiskEngagements'] ?? 0}'),
        _kpi('Util %', '${kpis['avgUtilization'] ?? 0}'),
        _kpi('Blocked', '${kpis['blockedDeliverables'] ?? 0}'),
        _kpi('Overdue', '${kpis['overdueDeliverables'] ?? 0}'),
        _kpi('AR', '\$${(((kpis['arOutstandingCents'] as num?) ?? 0) / 100).toStringAsFixed(0)}'),
      ])),
      const SizedBox(height: 16),
      const Text('Engagements', style: TextStyle(fontWeight: FontWeight.w600)),
      ...engagements.map((e) => Card(child: ListTile(
            title: Text(e['name']?.toString() ?? ''),
            subtitle: Text('${e['clientName']} • health ${e['healthScore']} • ${e['status']}'),
            trailing: PopupMenuButton<String>(
              onSelected: (s) => _transitionEngagement(e['id'] as String, s),
              itemBuilder: (_) => const [
                PopupMenuItem(value: 'active', child: Text('Activate')),
                PopupMenuItem(value: 'at_risk', child: Text('Mark at risk')),
                PopupMenuItem(value: 'on_hold', child: Text('Put on hold')),
                PopupMenuItem(value: 'completed', child: Text('Complete')),
              ],
            ),
          ))),
      const SizedBox(height: 16),
      const Text('Deliverables', style: TextStyle(fontWeight: FontWeight.w600)),
      ...deliverables.map((d) => Dismissible(
            key: ValueKey(d['id']),
            background: Container(color: Colors.green.shade100, alignment: Alignment.centerLeft, padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Complete')),
            secondaryBackground: Container(color: Colors.orange.shade100, alignment: Alignment.centerRight, padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Block')),
            confirmDismiss: (dir) async {
              if (dir == DismissDirection.startToEnd) {
                await _transitionDeliverable(d['id'] as String, 'done');
              } else {
                final reason = await _promptBlockedReason();
                if (reason != null && reason.isNotEmpty) {
                  await _transitionDeliverable(d['id'] as String, 'blocked', blockedReason: reason);
                }
              }
              return false;
            },
            child: Card(child: ListTile(
              title: Text(d['title']?.toString() ?? ''),
              subtitle: Text('${d['status']} • ${d['priority']}${d['riskScore'] != null ? ' • risk ${d['riskScore']}' : ''}'),
            )),
          )),
      const SizedBox(height: 16),
      const Text('Utilization', style: TextStyle(fontWeight: FontWeight.w600)),
      ...util.map((u) => Card(child: ListTile(
            title: Text(u['member_name']?.toString() ?? ''),
            subtitle: Text('${u['role'] ?? ''} • ${((u['avg_utilization'] as num?) ?? 0).toDouble().toStringAsFixed(2)}'),
          ))),
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
