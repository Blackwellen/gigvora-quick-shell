import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'billing_invoices_tax_api.dart';

/// Domain 58 — Billing, Invoices, Tax & Subscriptions mobile screen.
///
/// Mobile affordances:
///   • Sticky KPI header (outstanding, overdue, MRR).
///   • Invoice list as touch-friendly cards with swipe-to-remind.
///   • Tap an invoice → bottom sheet with status + payment controls.
class BillingInvoicesTaxScreen extends ConsumerStatefulWidget {
  const BillingInvoicesTaxScreen({super.key});
  @override
  ConsumerState<BillingInvoicesTaxScreen> createState() => _State();
}

class _State extends ConsumerState<BillingInvoicesTaxScreen> {
  Map<String, dynamic>? _overview;
  List<dynamic> _invoices = const [];
  List<dynamic> _subs = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _refresh(); }

  Future<void> _refresh() async {
    setState(() { _loading = true; _error = null; });
    try {
      final api = BillingInvoicesTaxApi(ref.read(apiClientProvider));
      _overview = await api.overview();
      _invoices = await api.invoices();
      _subs = await api.subscriptions();
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _openInvoice(Map<String, dynamic> inv) async {
    final api = BillingInvoicesTaxApi(ref.read(apiClientProvider));
    await showModalBottomSheet(
      context: context, isScrollControlled: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(ctx).viewInsets.bottom + 16),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text('${inv['number']} • £${((inv['totalMinor'] ?? 0) as int)/100}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
            Text('Status: ${inv['status']}'),
            const SizedBox(height: 12),
            if (inv['status'] == 'open' || inv['status'] == 'partially_paid') ...[
              FilledButton(onPressed: () async {
                await api.recordPayment(inv['id'] as String, amountMinor: (inv['totalMinor'] as int) - ((inv['paidMinor'] ?? 0) as int), providerRef: 'mob_${DateTime.now().millisecondsSinceEpoch}');
                if (mounted) { Navigator.pop(ctx); await _refresh(); }
              }, child: const Text('Record full payment')),
              const SizedBox(height: 8),
              OutlinedButton(onPressed: () async { await api.remind(inv['id'] as String); if (mounted) Navigator.pop(ctx); },
                child: const Text('Send reminder')),
            ],
            if (inv['status'] == 'draft')
              FilledButton(onPressed: () async { await api.transitionInvoice(inv['id'] as String, 'open'); if (mounted) { Navigator.pop(ctx); await _refresh(); } }, child: const Text('Issue invoice')),
          ]),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Billing & invoices')),
      body: RefreshIndicator(onRefresh: _refresh,
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
    return ListView(padding: const EdgeInsets.all(16), children: [
      Container(padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(16)),
        child: Row(children: [
          Expanded(child: _stat('Outstanding', '£${((kpis['outstandingMinor'] ?? 0) as int)/100}')),
          Expanded(child: _stat('Overdue', '£${((kpis['overdueMinor'] ?? 0) as int)/100}')),
          Expanded(child: _stat('MRR', '£${((kpis['mrrMinor'] ?? 0) as int)/100}')),
        ]),
      ),
      const SizedBox(height: 16),
      const Text('Invoices', style: TextStyle(fontWeight: FontWeight.w600)),
      ..._invoices.map((i) {
        final inv = Map<String, dynamic>.from(i as Map);
        return Dismissible(
          key: ValueKey(inv['id']),
          direction: DismissDirection.endToStart,
          confirmDismiss: (_) async {
            final api = BillingInvoicesTaxApi(ref.read(apiClientProvider));
            await api.remind(inv['id'] as String);
            if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reminder scheduled')));
            return false;
          },
          background: Container(color: Colors.amber.shade200, alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 16), child: const Icon(Icons.notifications)),
          child: Card(child: ListTile(
            title: Text('${inv['number']} • ${inv['customerName']}'),
            subtitle: Text('${inv['status']} • due ${inv['dueDate'] ?? '-'}'),
            trailing: Text('£${((inv['totalMinor'] ?? 0) as int)/100}'),
            onTap: () => _openInvoice(inv),
          )),
        );
      }),
      const SizedBox(height: 16),
      const Text('Subscriptions', style: TextStyle(fontWeight: FontWeight.w600)),
      ..._subs.map((s) => ListTile(dense: true,
        title: Text(s['planName']?.toString() ?? ''),
        subtitle: Text('${s['status']} • £${((s['amountMinor'] ?? 0) as int)/100}/${s['interval']}'),
      )),
    ]);
  }

  Widget _stat(String label, String value) => Column(children: [
    Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
    const SizedBox(height: 4),
    Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
  ]);
}
