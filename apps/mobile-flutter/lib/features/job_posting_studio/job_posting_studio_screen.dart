import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'job_posting_studio_api.dart';

/// Domain 24 mobile parity: jobs list (status chips), detail bottom sheet
/// with Publish (sticky bar), 3-step credit checkout (Choose pack → Billing → Result),
/// pause/resume/archive swipe actions.
final studioApiProvider = Provider<JobPostingStudioApi>((ref) => JobPostingStudioApi(ref.watch(apiClientProvider)));
final studioListProvider = FutureProvider.family<Map<String, dynamic>, Map<String, dynamic>>((ref, f) => ref.watch(studioApiProvider).list(f));

class JobPostingStudioScreen extends ConsumerStatefulWidget {
  const JobPostingStudioScreen({super.key});
  @override ConsumerState<JobPostingStudioScreen> createState() => _S();
}
class _S extends ConsumerState<JobPostingStudioScreen> {
  Map<String, dynamic> filters = {'page': 1, 'pageSize': 20, 'sort': 'updated'};

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(studioListProvider(filters));
    return Scaffold(
      appBar: AppBar(title: const Text('Posting Studio'), actions: [
        IconButton(icon: const Icon(Icons.account_balance_wallet), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const _CreditsScreen()))),
      ]),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (env) {
          final rows = (env['items'] as List).cast<Map<String, dynamic>>();
          if (rows.isEmpty) return const Center(child: Text('No postings yet.'));
          return ListView.separated(
            itemCount: rows.length, separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final j = rows[i];
              return Dismissible(
                key: ValueKey(j['id']),
                background: Container(color: Colors.orange, alignment: Alignment.centerLeft, padding: const EdgeInsets.all(16), child: const Icon(Icons.pause)),
                secondaryBackground: Container(color: Colors.red, alignment: Alignment.centerRight, padding: const EdgeInsets.all(16), child: const Icon(Icons.archive)),
                confirmDismiss: (dir) async {
                  final api = ref.read(studioApiProvider);
                  if (dir == DismissDirection.startToEnd) { await api.pause(j['id'] as String); }
                  else { await api.archive(j['id'] as String); }
                  ref.invalidate(studioListProvider(filters));
                  return false;
                },
                child: ListTile(
                  title: Text(j['title'] as String),
                  subtitle: Text('${j['status']} · ${j['applications']} apps · v${j['version']}'),
                  trailing: Chip(label: Text(j['status'] as String)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _CreditsScreen extends ConsumerStatefulWidget {
  const _CreditsScreen();
  @override ConsumerState<_CreditsScreen> createState() => _CS();
}
class _CS extends ConsumerState<_CreditsScreen> {
  int step = 0; String? packId; String? purchaseId; bool tos = false;
  final name = TextEditingController(); final email = TextEditingController(); final country = TextEditingController(text: 'GB');

  Future<void> _next() async {
    final api = ref.read(studioApiProvider);
    if (step == 0 && packId != null) {
      final p = await api.createPurchase(packId!);
      setState(() { purchaseId = p['id'] as String; step = 1; });
    } else if (step == 1 && tos) {
      await api.confirmPurchase(purchaseId!, {
        'paymentMethod': 'card',
        'billing': {'name': name.text, 'email': email.text, 'country': country.text},
        'acceptTos': true,
      });
      setState(() => step = 2);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Buy Posting Credits')),
      body: Padding(padding: const EdgeInsets.all(16), child: [
        FutureBuilder(
          future: ref.read(studioApiProvider).packs(),
          builder: (_, snap) {
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            final packs = (snap.data as List).cast<Map<String, dynamic>>();
            return Column(children: [
              ...packs.map((p) => RadioListTile<String>(
                value: p['id'] as String, groupValue: packId,
                title: Text('${p['postings']} postings'), subtitle: Text('£${(p['priceCents'] as int) / 100}'),
                onChanged: (v) => setState(() => packId = v),
              )),
              const Spacer(),
              ElevatedButton(onPressed: packId == null ? null : _next, child: const Text('Continue')),
            ]);
          },
        ),
        Column(children: [
          TextField(controller: name, decoration: const InputDecoration(labelText: 'Name')),
          TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')),
          TextField(controller: country, decoration: const InputDecoration(labelText: 'Country (ISO-2)')),
          CheckboxListTile(value: tos, onChanged: (v) => setState(() => tos = v ?? false), title: const Text('Accept terms')),
          const Spacer(),
          ElevatedButton(onPressed: tos ? _next : null, child: const Text('Pay')),
        ]),
        const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.check_circle, color: Colors.green, size: 56), SizedBox(height: 8), Text('Credits added.')])),
      ][step]),
    );
  }
}
