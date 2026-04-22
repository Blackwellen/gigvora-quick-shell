import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'enterprise_dashboard_api.dart';

/// Domain 53 — Enterprise dashboard mobile screen.
///
/// Mobile-specific affordances:
///   • Horizontal KPI tiles for hiring/procurement/team/spend.
///   • Requisition cards expose status menu (open/on_hold/filled/cancelled).
///   • Purchase orders: tap to approve, long-press to reject (bottom sheet).
///   • Tasks support swipe-right (complete) and swipe-left (block).
class EnterpriseDashboardScreen extends ConsumerStatefulWidget {
  const EnterpriseDashboardScreen({super.key});
  @override
  ConsumerState<EnterpriseDashboardScreen> createState() => _State();
}

class _State extends ConsumerState<EnterpriseDashboardScreen> {
  Map<String, dynamic>? _overview;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = EnterpriseDashboardApi(ref.read(apiClientProvider));
      final data = await api.overview();
      setState(() { _overview = data; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _transitionRequisition(String id, String status) async {
    try {
      await EnterpriseDashboardApi(ref.read(apiClientProvider)).transitionRequisition(id, status);
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _transitionPo(String id, String status, {String? reason}) async {
    try {
      await EnterpriseDashboardApi(ref.read(apiClientProvider))
          .transitionPurchaseOrder(id, status, reason: reason,
              receivedOn: status == 'received' ? DateTime.now().toIso8601String().substring(0, 10) : null);
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _transitionTask(String id, String status, {String? blockedReason}) async {
    try {
      await EnterpriseDashboardApi(ref.read(apiClientProvider))
          .transitionTask(id, status, blockedReason: blockedReason);
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<String?> _promptReason(String label) async {
    final ctrl = TextEditingController();
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Enterprise dashboard')),
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
    final reqs = (_overview?['requisitions'] as List?) ?? [];
    final pos = (_overview?['purchaseOrders'] as List?) ?? [];
    final tasks = (_overview?['tasks'] as List?) ?? [];
    final members = (_overview?['members'] as List?) ?? [];

    return ListView(padding: const EdgeInsets.all(16), children: [
      SizedBox(height: 92, child: ListView(scrollDirection: Axis.horizontal, children: [
        _kpi('Open reqs', '${kpis['openRequisitions'] ?? 0}'),
        _kpi('PO pending', '${kpis['pendingPoApprovals'] ?? 0}'),
        _kpi('Headcount', '${kpis['headcount'] ?? 0}'),
        _kpi('Onboarding', '${kpis['onboarding'] ?? 0}'),
        _kpi('Blocked', '${kpis['blockedTasks'] ?? 0}'),
        _kpi('Spend', '\$${(((kpis['totalSpendCents'] as num?) ?? 0) / 100).toStringAsFixed(0)}'),
      ])),
      const SizedBox(height: 16),
      const Text('Requisitions', style: TextStyle(fontWeight: FontWeight.w600)),
      ...reqs.map((r) => Card(child: ListTile(
            title: Text(r['title']?.toString() ?? ''),
            subtitle: Text('${r['department'] ?? ''} • ${r['seniority']} • ${r['status']} • ${r['applicants']} apps'),
            trailing: PopupMenuButton<String>(
              onSelected: (s) => _transitionRequisition(r['id'] as String, s),
              itemBuilder: (_) => const [
                PopupMenuItem(value: 'open', child: Text('Open')),
                PopupMenuItem(value: 'on_hold', child: Text('On hold')),
                PopupMenuItem(value: 'filled', child: Text('Filled')),
                PopupMenuItem(value: 'cancelled', child: Text('Cancel')),
              ],
            ),
          ))),
      const SizedBox(height: 16),
      const Text('Purchase orders', style: TextStyle(fontWeight: FontWeight.w600)),
      ...pos.map((p) => Card(child: ListTile(
            title: Text('${p['poNumber']} • ${p['vendorName']}'),
            subtitle: Text('${p['status']} • \$${(((p['amountCents'] as num?) ?? 0) / 100).toStringAsFixed(0)}'
                '${p['riskScore'] != null ? ' • risk ${p['riskScore']}' : ''}'),
            onTap: () => _transitionPo(p['id'] as String, 'approved'),
            onLongPress: () async {
              final reason = await _promptReason('Reason for rejection');
              if (reason != null && reason.isNotEmpty) {
                await _transitionPo(p['id'] as String, 'rejected', reason: reason);
              }
            },
          ))),
      const SizedBox(height: 16),
      const Text('Team tasks', style: TextStyle(fontWeight: FontWeight.w600)),
      ...tasks.map((t) => Dismissible(
            key: ValueKey(t['id']),
            background: Container(color: Colors.green.shade100, alignment: Alignment.centerLeft, padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Complete')),
            secondaryBackground: Container(color: Colors.orange.shade100, alignment: Alignment.centerRight, padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Block')),
            confirmDismiss: (dir) async {
              if (dir == DismissDirection.startToEnd) {
                await _transitionTask(t['id'] as String, 'done');
              } else {
                final reason = await _promptReason('Reason for blocking');
                if (reason != null && reason.isNotEmpty) {
                  await _transitionTask(t['id'] as String, 'blocked', blockedReason: reason);
                }
              }
              return false;
            },
            child: Card(child: ListTile(
              title: Text(t['title']?.toString() ?? ''),
              subtitle: Text('${t['status']} • ${t['priority']} • ${t['category'] ?? ''}'),
            )),
          )),
      const SizedBox(height: 16),
      const Text('Team', style: TextStyle(fontWeight: FontWeight.w600)),
      ...members.map((m) => Card(child: ListTile(
            title: Text(m['fullName']?.toString() ?? ''),
            subtitle: Text('${m['role'] ?? ''} • ${m['department'] ?? ''} • ${m['status']}'),
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
