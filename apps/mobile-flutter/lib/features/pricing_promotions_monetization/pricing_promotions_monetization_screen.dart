import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'pricing_promotions_monetization_api.dart';

/// Domain 64 — Pricing, Promotions & Monetization mobile screen.
///
/// Mobile affordances:
///   • Sticky KPI header (Active Packages, Active Promos, Redemptions).
///   • Tabs: Packages | Promotions | Quotes.
///   • Pull-to-refresh on every tab.
///   • Quote accept via confirm dialog.
class PricingPromotionsMonetizationScreen extends ConsumerStatefulWidget {
  const PricingPromotionsMonetizationScreen({super.key});
  @override
  ConsumerState<PricingPromotionsMonetizationScreen> createState() => _State();
}

class _State extends ConsumerState<PricingPromotionsMonetizationScreen> {
  Map<String, dynamic>? _overview;
  List<dynamic> _packages = const [];
  List<dynamic> _promos = const [];
  List<dynamic> _quotes = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = PricingPromotionsMonetizationApi(ref.read(apiClientProvider));
      _overview = await api.overview();
      _packages = await api.packages(status: 'active');
      _promos = await api.promotions(status: 'active');
      _quotes = await api.myQuotes();
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
    return DefaultTabController(length: 3, child: Scaffold(
      appBar: AppBar(title: const Text('Pricing & Promos'), bottom: const TabBar(tabs: [
        Tab(text: 'Packages'), Tab(text: 'Promotions'), Tab(text: 'Quotes'),
      ])),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null ? Center(child: Text('Error: $_error'))
        : Column(children: [
            Container(margin: const EdgeInsets.all(16), padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(16)),
              child: Row(children: [
                Expanded(child: _stat('Packages', '${kpis['activePackages'] ?? 0}')),
                Expanded(child: _stat('Promos', '${kpis['activePromotions'] ?? 0}')),
                Expanded(child: _stat('Redemptions', '${kpis['totalRedeemed'] ?? 0}')),
              ])),
            Expanded(child: TabBarView(children: [
              RefreshIndicator(onRefresh: _refresh, child: ListView(children: _packages.map((p) {
                final m = Map<String, dynamic>.from(p as Map);
                return ListTile(
                  leading: Icon(m['highlight'] == true ? Icons.star : Icons.inventory_2_outlined,
                                color: m['highlight'] == true ? Colors.amber : null),
                  title: Text('${m['name']} • ${_money(m['priceMinor'] as int?, m['currency'] as String? ?? 'GBP')}'),
                  subtitle: Text('${m['tier']} • ${m['billingInterval']} • ${(m['features'] as List?)?.length ?? 0} feature(s)'));
              }).toList())),
              RefreshIndicator(onRefresh: _refresh, child: ListView(children: _promos.map((p) {
                final m = Map<String, dynamic>.from(p as Map);
                final value = m['kind'] == 'percent'
                  ? '${((m['valueBps'] as int?) ?? 0) / 100}%'
                  : m['kind'] == 'fixed'
                    ? _money(m['valueMinor'] as int?, m['currency'] as String? ?? 'GBP')
                    : 'Free trial';
                return ListTile(
                  leading: const Icon(Icons.local_offer_outlined),
                  title: Text('${m['code']} • $value'),
                  subtitle: Text('${m['status']} • ${m['redeemedCount'] ?? 0}/${m['maxRedemptions'] ?? '∞'} used'));
              }).toList())),
              RefreshIndicator(onRefresh: _refresh, child: ListView(children: _quotes.map((q) {
                final m = Map<String, dynamic>.from(q as Map);
                return ListTile(
                  leading: const Icon(Icons.request_quote_outlined),
                  title: Text(_money(m['totalMinor'] as int?, m['currency'] as String? ?? 'GBP')),
                  subtitle: Text('${m['status']} • ${(m['lineItems'] as List?)?.length ?? 0} item(s)'));
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
