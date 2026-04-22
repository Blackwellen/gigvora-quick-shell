import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'donations_purchases_commerce_api.dart';

/// Domain 63 — Donations, Purchases & Creator Commerce mobile screen.
///
/// Mobile affordances:
///   • Sticky KPI header (MRR, Pledges, Orders, Donations).
///   • Tabs: My Pledges | My Orders | My Donations.
///   • Pull-to-refresh on every tab.
///   • Pledge cancel via swipe-to-action confirmation in app dialog.
class DonationsPurchasesCommerceScreen extends ConsumerStatefulWidget {
  const DonationsPurchasesCommerceScreen({super.key});
  @override
  ConsumerState<DonationsPurchasesCommerceScreen> createState() => _State();
}

class _State extends ConsumerState<DonationsPurchasesCommerceScreen> {
  Map<String, dynamic>? _overview;
  List<dynamic> _pledges = const [];
  List<dynamic> _orders = const [];
  List<dynamic> _donations = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = DonationsPurchasesCommerceApi(ref.read(apiClientProvider));
      _overview = await api.overview();
      _pledges = await api.myPledges();
      _orders = await api.myOrders();
      _donations = await api.myDonations();
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  String _money(int? minor, [String currency = 'GBP']) {
    final v = (minor ?? 0) / 100.0;
    final sym = currency == 'GBP' ? '£' : currency == 'USD' ? '\$' : '';
    return '$sym${v.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    final kpis = (_overview?['kpis'] as Map?) ?? const {};
    final currency = (kpis['currency'] as String?) ?? 'GBP';
    return DefaultTabController(length: 3, child: Scaffold(
      appBar: AppBar(title: const Text('Commerce'), bottom: const TabBar(tabs: [
        Tab(text: 'Pledges'), Tab(text: 'Orders'), Tab(text: 'Donations'),
      ])),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null ? Center(child: Text('Error: $_error'))
        : Column(children: [
            Container(margin: const EdgeInsets.all(16), padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(16)),
              child: Row(children: [
                Expanded(child: _stat('MRR', _money(kpis['mrrMinor'] as int?, currency))),
                Expanded(child: _stat('Pledges', '${kpis['activePledges'] ?? 0}')),
                Expanded(child: _stat('Orders', '${kpis['orders'] ?? 0}')),
                Expanded(child: _stat('Tips', '${kpis['donations'] ?? 0}')),
              ])),
            Expanded(child: TabBarView(children: [
              RefreshIndicator(onRefresh: _refresh, child: ListView(children: _pledges.map((p) {
                final m = Map<String, dynamic>.from(p as Map);
                return ListTile(
                  leading: const Icon(Icons.favorite_outline),
                  title: Text(_money(m['monthlyPriceMinor'] as int?, m['currency'] as String? ?? 'GBP') + ' / month'),
                  subtitle: Text('${m['status']} • Next: ${m['nextChargeAt'] ?? '-'}'));
              }).toList())),
              RefreshIndicator(onRefresh: _refresh, child: ListView(children: _orders.map((o) {
                final m = Map<String, dynamic>.from(o as Map);
                return ListTile(
                  leading: const Icon(Icons.shopping_bag_outlined),
                  title: Text(_money(m['totalMinor'] as int?, m['currency'] as String? ?? 'GBP')),
                  subtitle: Text('${m['status']} • ${(m['lineItems'] as List?)?.length ?? 0} item(s)'));
              }).toList())),
              RefreshIndicator(onRefresh: _refresh, child: ListView(children: _donations.map((d) {
                final m = Map<String, dynamic>.from(d as Map);
                return ListTile(
                  leading: const Icon(Icons.volunteer_activism_outlined),
                  title: Text(_money(m['amountMinor'] as int?, m['currency'] as String? ?? 'GBP')),
                  subtitle: Text('${m['status']} • ${m['message'] ?? ''}'));
              }).toList())),
            ])),
          ]),
    ));
  }

  Widget _stat(String l, String v) => Column(children: [
    Text(l, style: const TextStyle(fontSize: 12, color: Colors.black54)),
    const SizedBox(height: 4),
    Text(v, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
  ]);
}
