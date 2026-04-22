import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'webinars_api.dart';

/// Domain 22 mobile parity — discovery list, detail bottom sheet, live-room
/// launch (defers to a Jitsi WebView), and a 3-step checkout
/// (Review → Confirm → Result).
final webinarsApiProvider = Provider<WebinarsApi>((ref) => WebinarsApi(ref.watch(apiClientProvider)));

final webinarsDiscoverProvider = FutureProvider.family<Map<String, dynamic>, Map<String, dynamic>>((ref, f) {
  return ref.watch(webinarsApiProvider).discover(f);
});

class WebinarsScreen extends ConsumerStatefulWidget {
  const WebinarsScreen({super.key});
  @override ConsumerState<WebinarsScreen> createState() => _WebinarsScreenState();
}

class _WebinarsScreenState extends ConsumerState<WebinarsScreen> {
  Map<String, dynamic> filters = {'page': 1, 'pageSize': 20, 'sort': 'relevance'};
  final searchCtrl = TextEditingController();

  void _openDetail(BuildContext c, Map<String, dynamic> w) {
    showModalBottomSheet(context: c, isScrollControlled: true, builder: (_) => _DetailSheet(webinar: w));
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(webinarsDiscoverProvider(filters));
    return Scaffold(
      appBar: AppBar(title: const Text('Webinars')),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: searchCtrl,
            decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search webinars'),
            onSubmitted: (v) => setState(() => filters = {...filters, 'q': v}),
          ),
        ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
            data: (env) {
              final rows = (env['results'] as List).cast<Map<String, dynamic>>();
              if (rows.isEmpty) return const Center(child: Text('No webinars found.'));
              return RefreshIndicator(
                onRefresh: () async => ref.invalidate(webinarsDiscoverProvider(filters)),
                child: ListView.separated(
                  itemCount: rows.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final w = rows[i];
                    final live = w['status'] == 'live';
                    return ListTile(
                      leading: CircleAvatar(child: Text((w['title'] as String).substring(0, 1))),
                      title: Text(w['title'] as String),
                      subtitle: Text('${(w['host'] as Map)['name']} · ${w['startsAt']}'),
                      trailing: live
                          ? Chip(label: const Text('LIVE'), backgroundColor: Colors.red.shade100)
                          : Text('${w['registrations']}/${(w['ticket'] as Map)['capacity']}'),
                      onTap: () => _openDetail(context, w),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ]),
    );
  }
}

class _DetailSheet extends ConsumerWidget {
  final Map<String, dynamic> webinar;
  const _DetailSheet({required this.webinar});
  @override
  Widget build(BuildContext c, WidgetRef ref) {
    final ticket = webinar['ticket'] as Map;
    final paid = (ticket['priceCents'] as int) > 0;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(webinar['title'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 6),
          Text(webinar['description'] as String),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: ElevatedButton.icon(
              icon: const Icon(Icons.event_available),
              label: const Text('Register'),
              onPressed: () async => await ref.read(webinarsApiProvider).register(webinar['id'] as String),
            )),
            const SizedBox(width: 8),
            if (paid) Expanded(child: OutlinedButton.icon(
              icon: const Icon(Icons.shopping_bag),
              label: Text('Buy £${(ticket['priceCents'] as int) / 100}'),
              onPressed: () => Navigator.push(c, MaterialPageRoute(builder: (_) => _CheckoutScreen(webinar: webinar))),
            )),
          ]),
          if (webinar['donationsEnabled'] == true) ...[
            const SizedBox(height: 8),
            OutlinedButton.icon(
              icon: const Icon(Icons.favorite_outline),
              label: const Text('Donate'),
              onPressed: () async => await ref.read(webinarsApiProvider).donate(webinar['id'] as String, {'amountCents': 500, 'currency': 'GBP'}),
            ),
          ],
        ]),
      ),
    );
  }
}

class _CheckoutScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> webinar;
  const _CheckoutScreen({required this.webinar});
  @override ConsumerState<_CheckoutScreen> createState() => _CheckoutScreenState();
}
class _CheckoutScreenState extends ConsumerState<_CheckoutScreen> {
  int step = 0; String? purchaseId; bool acceptTos = false;
  final nameCtrl = TextEditingController(); final emailCtrl = TextEditingController(); final countryCtrl = TextEditingController(text: 'GB');

  Future<void> _next() async {
    if (step == 0) {
      final p = await ref.read(webinarsApiProvider).createPurchase(widget.webinar['id'] as String);
      setState(() { purchaseId = p['id'] as String; step = 1; });
    } else if (step == 1 && acceptTos) {
      await ref.read(webinarsApiProvider).confirmPurchase(purchaseId!, {
        'paymentMethod': 'card',
        'billing': {'name': nameCtrl.text, 'email': emailCtrl.text, 'country': countryCtrl.text},
        'acceptTos': true,
      });
      setState(() => step = 2);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: [
          // Step 0 — Review
          Column(children: [
            Text('Review: ${widget.webinar['title']}'),
            Text('£${((widget.webinar['ticket'] as Map)['priceCents'] as int) / 100}'),
            const Spacer(),
            ElevatedButton(onPressed: _next, child: const Text('Continue')),
          ]),
          // Step 1 — Confirm
          Column(children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Full name')),
            TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
            TextField(controller: countryCtrl, decoration: const InputDecoration(labelText: 'Country (ISO-2)')),
            CheckboxListTile(value: acceptTos, onChanged: (v) => setState(() => acceptTos = v ?? false), title: const Text('I accept the terms')),
            const Spacer(),
            ElevatedButton(onPressed: acceptTos ? _next : null, child: const Text('Pay now')),
          ]),
          // Step 2 — Success
          const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.check_circle, color: Colors.green, size: 56),
            SizedBox(height: 8),
            Text('Purchase confirmed — receipt sent.'),
          ])),
        ][step],
      ),
    );
  }
}
