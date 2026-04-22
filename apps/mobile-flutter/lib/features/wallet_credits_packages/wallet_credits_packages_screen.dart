import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'wallet_credits_packages_api.dart';

/// Domain 57 — Wallet, credits & purchase flows mobile screen.
///
/// Mobile affordances:
///   • Sticky balance header (cash + credits).
///   • Catalog as touch-friendly cards with tap-to-buy.
///   • Purchase confirmation in a bottom sheet (provider ref input).
///   • Recent ledger as compact list with severity colour.
class WalletCreditsPackagesScreen extends ConsumerStatefulWidget {
  const WalletCreditsPackagesScreen({super.key});
  @override
  ConsumerState<WalletCreditsPackagesScreen> createState() => _State();
}

class _State extends ConsumerState<WalletCreditsPackagesScreen> {
  Map<String, dynamic>? _overview;
  Map<String, dynamic>? _catalog;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = WalletCreditsPackagesApi(ref.read(apiClientProvider));
      _overview = await api.overview();
      _catalog = await api.catalog();
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _buy(Map<String, dynamic> pkg) async {
    final api = WalletCreditsPackagesApi(ref.read(apiClientProvider));
    try {
      final purchase = await api.createPurchase(
        packageId: pkg['id'] as String,
        idempotencyKey: 'mob-${DateTime.now().millisecondsSinceEpoch}',
      );
      if (!mounted) return;
      final ref0 = await showModalBottomSheet<String>(
        context: context, isScrollControlled: true,
        builder: (ctx) {
          final ctrl = TextEditingController(text: 'pi_demo_${DateTime.now().millisecondsSinceEpoch}');
          return Padding(
            padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 16),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text('Confirm purchase £${(purchase['amountMinor'] as int)/100}'),
              TextField(controller: ctrl, decoration: const InputDecoration(labelText: 'Provider reference')),
              const SizedBox(height: 12),
              FilledButton(onPressed: () => Navigator.pop(ctx, ctrl.text.trim()), child: const Text('Confirm')),
            ]),
          );
        },
      );
      if (ref0 != null && ref0.isNotEmpty) {
        await api.confirmPurchase(purchase['id'] as String, providerRef: ref0);
        await _refresh();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wallet & credits')),
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
    final w = (_overview?['wallet'] as Map?) ?? {};
    final kpis = (_overview?['kpis'] as Map?) ?? {};
    final cat = (_catalog?['items'] as List?) ?? [];
    final ledger = (_overview?['recentLedger'] as List?) ?? [];

    return ListView(padding: const EdgeInsets.all(16), children: [
      Container(padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(16)),
        child: Row(children: [
          Expanded(child: _stat('Cash', '£${((w['cashBalanceMinor'] ?? 0) as int)/100}')),
          Expanded(child: _stat('Credits', '${w['creditBalance'] ?? 0}')),
          Expanded(child: _stat('Held', '£${((w['heldBalanceMinor'] ?? 0) as int)/100}')),
        ]),
      ),
      const SizedBox(height: 12),
      Text('Lifetime spend: £${((kpis['lifetimeSpendMinor'] ?? 0) as int)/100}'),
      const SizedBox(height: 16),
      const Text('Catalog', style: TextStyle(fontWeight: FontWeight.w600)),
      ...cat.map((p) => Card(child: ListTile(
        title: Text(p['name']?.toString() ?? ''),
        subtitle: Text('${p['kind']} • ${p['creditsGranted']} credits'),
        trailing: FilledButton(onPressed: () => _buy(Map<String, dynamic>.from(p as Map)),
          child: Text('£${((p['priceMinor'] ?? 0) as int)/100}')),
      ))),
      const SizedBox(height: 16),
      const Text('Recent ledger', style: TextStyle(fontWeight: FontWeight.w600)),
      ...ledger.map((e) => ListTile(dense: true,
        title: Text('${e['kind']}'),
        subtitle: Text(e['reference']?.toString() ?? ''),
        trailing: Text('${(e['amountMinor'] ?? 0) != 0 ? '£${((e['amountMinor'] ?? 0) as int)/100}' : '${e['credits']} cr'}'),
      )),
    ]);
  }

  Widget _stat(String label, String value) => Column(children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
      ]);
}
