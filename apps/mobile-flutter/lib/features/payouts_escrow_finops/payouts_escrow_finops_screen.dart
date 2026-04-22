import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'payouts_escrow_finops_api.dart';

/// Domain 59 — Payouts, Escrow & Finops mobile screen.
///
/// Mobile affordances:
///   • Sticky header with available/reserved/held KPIs.
///   • Tabbed list (Payouts | Escrows | Holds) inside DefaultTabController.
///   • Tap a payout/escrow → bottom sheet with the appropriate action.
class PayoutsEscrowFinopsScreen extends ConsumerStatefulWidget {
  const PayoutsEscrowFinopsScreen({super.key});
  @override
  ConsumerState<PayoutsEscrowFinopsScreen> createState() => _State();
}

class _State extends ConsumerState<PayoutsEscrowFinopsScreen> {
  Map<String, dynamic>? _overview;
  List<dynamic> _payouts = const [];
  List<dynamic> _escrows = const [];
  List<dynamic> _holds = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = PayoutsEscrowFinopsApi(ref.read(apiClientProvider));
      _overview = await api.overview();
      _payouts = await api.payouts();
      _escrows = await api.escrows(role: 'payee');
      _holds = await api.holds(status: 'open');
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _payoutSheet(Map<String, dynamic> p) async {
    final api = PayoutsEscrowFinopsApi(ref.read(apiClientProvider));
    await showModalBottomSheet(context: context, isScrollControlled: true, builder: (ctx) => Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('Payout ${p['reference']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
        Text('£${((p['amountMinor'] ?? 0) as int)/100} • ${p['status']}'),
        const SizedBox(height: 12),
        if (p['status'] == 'pending')
          FilledButton(onPressed: () async {
            await api.transitionPayout(p['id'] as String, 'cancelled', reason: 'Cancelled from mobile');
            if (mounted) { Navigator.pop(ctx); await _refresh(); }
          }, child: const Text('Cancel payout')),
        if (p['status'] == 'failed')
          FilledButton(onPressed: () async {
            await api.transitionPayout(p['id'] as String, 'processing');
            if (mounted) { Navigator.pop(ctx); await _refresh(); }
          }, child: const Text('Retry payout')),
      ]),
    ));
  }

  Future<void> _escrowSheet(Map<String, dynamic> e) async {
    final api = PayoutsEscrowFinopsApi(ref.read(apiClientProvider));
    final remaining = (e['amountMinor'] as int) - ((e['releasedMinor'] ?? 0) as int) - ((e['refundedMinor'] ?? 0) as int);
    await showModalBottomSheet(context: context, isScrollControlled: true, builder: (ctx) => Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('Escrow ${e['reference']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
        Text('Remaining £${remaining/100} • ${e['status']}'),
        const SizedBox(height: 12),
        if (remaining > 0) FilledButton(onPressed: () async {
          await api.releaseEscrow(e['id'] as String, remaining, reason: 'Milestone accepted');
          if (mounted) { Navigator.pop(ctx); await _refresh(); }
        }, child: const Text('Release remaining')),
      ]),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final kpis = (_overview?['kpis'] as Map?) ?? const {};
    return DefaultTabController(length: 3, child: Scaffold(
      appBar: AppBar(title: const Text('Payouts & Escrow'), bottom: const TabBar(tabs: [
        Tab(text: 'Payouts'), Tab(text: 'Escrows'), Tab(text: 'Holds'),
      ])),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
          ? Center(child: Text('Error: $_error'))
          : Column(children: [
              Container(margin: const EdgeInsets.all(16), padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(16)),
                child: Row(children: [
                  Expanded(child: _stat('Available', '£${((kpis['availableMinor'] ?? 0) as int)/100}')),
                  Expanded(child: _stat('Reserved', '£${((kpis['reservedMinor'] ?? 0) as int)/100}')),
                  Expanded(child: _stat('Escrow', '£${((kpis['heldEscrowMinor'] ?? 0) as int)/100}')),
                ])),
              Expanded(child: TabBarView(children: [
                RefreshIndicator(onRefresh: _refresh, child: ListView(children: _payouts.map((p) {
                  final m = Map<String, dynamic>.from(p as Map);
                  return ListTile(title: Text(m['reference']?.toString() ?? ''),
                    subtitle: Text('${m['status']} • £${((m['amountMinor'] ?? 0) as int)/100}'),
                    onTap: () => _payoutSheet(m));
                }).toList())),
                RefreshIndicator(onRefresh: _refresh, child: ListView(children: _escrows.map((e) {
                  final m = Map<String, dynamic>.from(e as Map);
                  return ListTile(title: Text(m['reference']?.toString() ?? ''),
                    subtitle: Text('${m['status']} • £${((m['amountMinor'] ?? 0) as int)/100}'),
                    onTap: () => _escrowSheet(m));
                }).toList())),
                RefreshIndicator(onRefresh: _refresh, child: ListView(children: _holds.map((h) {
                  final m = Map<String, dynamic>.from(h as Map);
                  return ListTile(title: Text(m['reasonCode']?.toString() ?? ''),
                    subtitle: Text('${m['subjectType']} • ${m['status']}'));
                }).toList())),
              ])),
            ]),
    ));
  }

  Widget _stat(String l, String v) => Column(children: [
    Text(l, style: const TextStyle(fontSize: 12, color: Colors.black54)),
    const SizedBox(height: 4),
    Text(v, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
  ]);
}
