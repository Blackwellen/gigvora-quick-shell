import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/async_state_view.dart';
import 'podcasts_api.dart';

/// Reduced-but-complete Flutter parity for Domain 21:
///   • Discovery list (top app bar search)
///   • Show detail bottom sheet with episode list
///   • Inline play/queue actions
///   • Multi-step purchase bottom sheet (Review → Confirm → Success/Failure)
class PodcastsScreen extends ConsumerStatefulWidget {
  const PodcastsScreen({super.key});
  @override
  ConsumerState<PodcastsScreen> createState() => _PodcastsScreenState();
}

class _PodcastsScreenState extends ConsumerState<PodcastsScreen> {
  String? _q;

  @override
  Widget build(BuildContext context) {
    final discover = ref.watch(podcastDiscoverProvider(_q));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Podcasts'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search podcasts',
                prefixIcon: Icon(Icons.search),
                filled: true,
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
              ),
              onSubmitted: (v) => setState(() => _q = v.isEmpty ? null : v),
            ),
          ),
        ),
      ),
      body: AsyncStateView<List<dynamic>>(
        async: discover,
        empty: (data) => data.isEmpty,
        builder: (shows) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(podcastDiscoverProvider(_q)),
          child: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: shows.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final s = shows[i] as Map<String, dynamic>;
              return Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  leading: CircleAvatar(child: Text((s['title'] ?? '?').toString().substring(0, 1))),
                  title: Text(s['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${s['category'] ?? '—'} · ${s['subscribers'] ?? 0} subs · ★ ${s['rating'] ?? 0}'),
                  trailing: Text('${s['episodes'] ?? 0} ep'),
                  onTap: () => _openShow(s['id'] as String),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  void _openShow(String id) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.85, maxChildSize: 0.95, minChildSize: 0.5, expand: false,
        builder: (ctx, scroll) => _ShowSheet(showId: id, scroll: scroll),
      ),
    );
  }
}

class _ShowSheet extends ConsumerWidget {
  final String showId;
  final ScrollController scroll;
  const _ShowSheet({required this.showId, required this.scroll});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final showAsync = ref.watch(podcastShowProvider(showId));
    return AsyncStateView<Map<String, dynamic>>(
      async: showAsync,
      builder: (data) {
        final show = (data['show'] ?? {}) as Map<String, dynamic>;
        final eps = (data['episodes'] as List?) ?? const [];
        return ListView(
          controller: scroll,
          padding: const EdgeInsets.all(16),
          children: [
            Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 12),
            Text(show['title'] ?? '', style: Theme.of(context).textTheme.titleLarge),
            Text(show['description'] ?? '', style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            Row(children: [
              FilledButton.icon(
                icon: const Icon(Icons.notifications_active_outlined),
                label: const Text('Subscribe'),
                onPressed: () async {
                  await ref.read(podcastsApiProvider).subscribe(showId);
                  if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Subscribed')));
                },
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                icon: const Icon(Icons.favorite_border),
                label: const Text('Favourite'),
                onPressed: () {},
              ),
            ]),
            const Divider(height: 32),
            Text('Episodes (${eps.length})', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final e in eps)
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: ListTile(
                  title: Text((e as Map)['title'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis),
                  subtitle: Text('${e['durationSec'] ?? 0}s · ${e['plays'] ?? 0} plays · ${e['access']}'),
                  trailing: Wrap(spacing: 4, children: [
                    IconButton(icon: const Icon(Icons.play_arrow), onPressed: () async {
                      await ref.read(podcastsApiProvider).play(e['id']);
                    }),
                    IconButton(icon: const Icon(Icons.queue_music), onPressed: () => ref.read(podcastsApiProvider).enqueue(e['id'])),
                    if ((e['priceCents'] ?? 0) > 0)
                      IconButton(icon: const Icon(Icons.shopping_cart), onPressed: () => _checkout(context, ref, e)),
                  ]),
                ),
              ),
          ],
        );
      },
    );
  }

  Future<void> _checkout(BuildContext context, WidgetRef ref, Map e) async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => _CheckoutSheet(episode: e),
    );
    if (ok == true && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Purchase complete')));
      ref.invalidate(podcastPurchasesProvider);
    }
  }
}

class _CheckoutSheet extends ConsumerStatefulWidget {
  final Map episode;
  const _CheckoutSheet({required this.episode});
  @override
  ConsumerState<_CheckoutSheet> createState() => _CheckoutSheetState();
}

class _CheckoutSheetState extends ConsumerState<_CheckoutSheet> {
  int _step = 0; // 0=review 1=confirm 2=result
  bool _ok = false;
  String? _err;
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final price = (widget.episode['priceCents'] ?? 0) as int;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Row(children: [
          Text('Checkout · Step ${_step + 1} / 3', style: Theme.of(context).textTheme.titleMedium),
          const Spacer(),
          IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context, _ok)),
        ]),
        const SizedBox(height: 12),
        if (_step == 0) ...[
          ListTile(title: const Text('Item'), subtitle: Text(widget.episode['title'] ?? ''), trailing: Text('\$${(price / 100).toStringAsFixed(2)}')),
          const ListTile(title: Text('Tax (auto)'), trailing: Text('Calculated by provider')),
          FilledButton(onPressed: () => setState(() => _step = 1), child: const Text('Review & Continue')),
        ] else if (_step == 1) ...[
          const ListTile(leading: Icon(Icons.lock_outline), title: Text('You will be charged via Stripe / Paddle.'),
              subtitle: Text('Payment processing handled by Lovable Payments — 100% secure.')),
          ListTile(title: const Text('Total'), trailing: Text('\$${(price / 100).toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold))),
          FilledButton(
            onPressed: _busy ? null : () async {
              setState(() => _busy = true);
              try {
                final p = await ref.read(podcastsApiProvider).createPurchase(
                  kind: 'episode', refId: widget.episode['id'], amountCents: price,
                );
                await ref.read(podcastsApiProvider).confirmPurchase(p['id'], providerRef: 'demo_${DateTime.now().millisecondsSinceEpoch}');
                setState(() { _ok = true; _step = 2; _busy = false; });
              } catch (e) {
                setState(() { _err = '$e'; _step = 2; _busy = false; });
              }
            },
            child: _busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Confirm payment'),
          ),
        ] else ...[
          if (_ok) ...[
            const ListTile(leading: Icon(Icons.check_circle, color: Colors.green), title: Text('Purchase complete!'), subtitle: Text('Receipt sent to your inbox.')),
            FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Done')),
          ] else ...[
            ListTile(leading: const Icon(Icons.error_outline, color: Colors.red), title: const Text('Payment failed'), subtitle: Text(_err ?? 'Unknown error')),
            OutlinedButton(onPressed: () => setState(() => _step = 1), child: const Text('Retry')),
          ],
        ],
      ]),
    );
  }
}
