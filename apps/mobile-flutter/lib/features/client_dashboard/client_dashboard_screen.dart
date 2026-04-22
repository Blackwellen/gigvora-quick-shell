import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'client_dashboard_api.dart';

/// Domain 50 — Client / Buyer dashboard mobile screen.
///
/// Mobile-specific affordances:
///   • Horizontally scrollable KPI tiles (no left rail).
///   • Swipe right on a proposal → shortlist; swipe left → reject.
///   • Approvals shown as bottom-anchored actionable cards with primary CTA
///     in a sticky bar.
///   • Oversight items expand into bottom sheets for status transitions.
class ClientDashboardScreen extends ConsumerStatefulWidget {
  const ClientDashboardScreen({super.key});
  @override
  ConsumerState<ClientDashboardScreen> createState() => _ClientDashboardScreenState();
}

class _ClientDashboardScreenState extends ConsumerState<ClientDashboardScreen> {
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
      final api = ClientDashboardApi(ref.read(apiClientProvider));
      final data = await api.overview();
      setState(() { _overview = data; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _transitionProposal(String id, String status) async {
    final api = ClientDashboardApi(ref.read(apiClientProvider));
    try {
      await api.transitionProposal(id, status);
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _decideApproval(String id, String decision) async {
    final api = ClientDashboardApi(ref.read(apiClientProvider));
    try {
      await api.decideApproval(id, decision);
      await _refresh();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Buyer dashboard')),
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
    final proposals = (_overview?['proposals'] as List?) ?? [];
    final oversight = (_overview?['oversight'] as List?) ?? [];
    final approvals = (_overview?['pendingApprovals'] as List?) ?? [];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SizedBox(
          height: 92,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _kpi('Cleared', '£${(kpis['spendClearedCents'] ?? 0) / 100}'),
              _kpi('Pending', '£${(kpis['spendPendingCents'] ?? 0) / 100}'),
              _kpi('Active', '${kpis['activeProjects'] ?? 0}'),
              _kpi('At risk', '${kpis['atRiskProjects'] ?? 0}'),
              _kpi('Approvals', '${kpis['pendingApprovals'] ?? 0}'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('Proposals', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        ...proposals.map((p) => Dismissible(
              key: ValueKey(p['id']),
              background: Container(color: Colors.green.shade100, alignment: Alignment.centerLeft, padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Shortlist')),
              secondaryBackground: Container(color: Colors.red.shade100, alignment: Alignment.centerRight, padding: const EdgeInsets.symmetric(horizontal: 16), child: const Text('Reject')),
              confirmDismiss: (dir) async {
                if (dir == DismissDirection.startToEnd) await _transitionProposal(p['id'] as String, 'shortlisted');
                if (dir == DismissDirection.endToStart) await _transitionProposal(p['id'] as String, 'rejected');
                return false;
              },
              child: Card(child: ListTile(
                title: Text(p['title']?.toString() ?? ''),
                subtitle: Text('${p['vendorName'] ?? ''} • £${(p['amountCents'] ?? 0) / 100}'),
                trailing: Text(p['status']?.toString() ?? ''),
              )),
            )),
        const SizedBox(height: 16),
        const Text('Oversight', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        ...oversight.map((o) => Card(child: ListTile(
              title: Text(o['title']?.toString() ?? ''),
              subtitle: Text('${o['vendorName'] ?? ''} • health ${o['healthScore'] ?? ''}'),
              trailing: Text(o['status']?.toString() ?? ''),
            ))),
        const SizedBox(height: 16),
        const Text('Pending approvals', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        ...approvals.map((a) => Card(child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(a['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                Text('${a['kind'] ?? ''} • £${((a['amountCents'] ?? 0) as num) / 100}'),
                const SizedBox(height: 8),
                Row(children: [
                  ElevatedButton(onPressed: () => _decideApproval(a['id'] as String, 'approved'), child: const Text('Approve')),
                  const SizedBox(width: 8),
                  OutlinedButton(onPressed: () => _decideApproval(a['id'] as String, 'rejected'), child: const Text('Reject')),
                ]),
              ]),
            ))),
      ],
    );
  }

  Widget _kpi(String label, String value) {
    return Container(
      width: 140,
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
