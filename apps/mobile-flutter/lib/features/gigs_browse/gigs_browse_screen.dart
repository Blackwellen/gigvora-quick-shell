// Domain 41 — Gigs Browse mobile screen (Flutter parity, reduced-but-complete).
//
// Reduced parity decisions for touch:
//   • Filters move into a bottom sheet (FilterSheet)
//   • Sort moves into a sticky chip row
//   • Long-press card → quick-actions bottom sheet (Bookmark, Share, Compare)
//   • Saved searches drawer accessible from the AppBar action
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'gigs_browse_providers.dart';

class GigsBrowseScreen extends ConsumerStatefulWidget {
  const GigsBrowseScreen({super.key});
  @override
  ConsumerState<GigsBrowseScreen> createState() => _GigsBrowseScreenState();
}

class _GigsBrowseScreenState extends ConsumerState<GigsBrowseScreen> {
  GigsBrowseQuery _query = const GigsBrowseQuery();
  final _searchCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final search = ref.watch(gigsBrowseSearchProvider(_query));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gigs'),
        actions: [
          IconButton(
            icon: const Icon(Icons.bookmark_outline),
            onPressed: () => _openSaved(context),
          ),
          IconButton(
            icon: const Icon(Icons.tune),
            onPressed: () => _openFilters(context),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search gigs',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onSubmitted: (v) => setState(() => _query = GigsBrowseQuery(q: v, sort: _query.sort)),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _sortChip('Relevance', 'relevance'),
                _sortChip('Newest', 'newest'),
                _sortChip('Price ↑', 'price_asc'),
                _sortChip('Price ↓', 'price_desc'),
                _sortChip('Rating', 'rating'),
                _sortChip('Fastest', 'fastest'),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: search.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => _ErrorState(message: '$e', onRetry: () => ref.invalidate(gigsBrowseSearchProvider)),
              data: (envelope) {
                final results = (envelope['results'] as List?) ?? const [];
                if (results.isEmpty) return const _EmptyState();
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(gigsBrowseSearchProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(12),
                    itemCount: results.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, i) => _GigCard(gig: results[i] as Map<String, dynamic>),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _sortChip(String label, String value) {
    final selected = _query.sort == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => setState(() => _query = GigsBrowseQuery(q: _query.q, sort: value)),
      ),
    );
  }

  void _openFilters(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _FilterSheet(
        initial: _query,
        onApply: (next) => setState(() => _query = next),
      ),
    );
  }

  void _openSaved(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => Consumer(builder: (ctx, ref, _) {
        final saved = ref.watch(gigsBrowseSavedSearchesProvider);
        return SafeArea(
          child: SizedBox(
            height: 380,
            child: saved.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('$e')),
              data: (rows) => ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  const Text('Saved searches', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  if (rows.isEmpty) const Padding(padding: EdgeInsets.all(16), child: Text('No saved searches yet.')),
                  for (final row in rows)
                    ListTile(
                      title: Text(row['label']?.toString() ?? 'Saved search'),
                      subtitle: Text('Cadence: ${row['alertCadence'] ?? 'off'}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () async {
                          await ref.read(gigsBrowseMutationsProvider).removeSavedSearch(row['id']);
                        },
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }
}

class _GigCard extends ConsumerWidget {
  const _GigCard({required this.gig});
  final Map<String, dynamic> gig;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pricing = (gig['pricing'] as Map?) ?? {};
    final rating = (gig['rating'] as Map?) ?? {};
    final seller = (gig['seller'] as Map?) ?? {};
    final priceCents = (pricing['fromCents'] as int?) ?? 0;
    final currency = (pricing['currency'] as String?) ?? 'GBP';
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onLongPress: () => _quickActions(context, ref, gig['id'] as String),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              CircleAvatar(child: Text((seller['name']?.toString() ?? '?').characters.first)),
              const SizedBox(width: 8),
              Expanded(child: Text(seller['name']?.toString() ?? 'Seller', style: const TextStyle(fontWeight: FontWeight.w600))),
              if (gig['isFeatured'] == true)
                const Chip(label: Text('Featured', style: TextStyle(fontSize: 11)), visualDensity: VisualDensity.compact),
            ]),
            const SizedBox(height: 8),
            Text(gig['title']?.toString() ?? '', maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 8),
            Row(children: [
              const Icon(Icons.star, size: 14, color: Colors.amber),
              const SizedBox(width: 2),
              Text('${rating['avg'] ?? '0'} (${rating['count'] ?? 0})'),
              const Spacer(),
              Text('From $currency ${(priceCents / 100).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700)),
            ]),
          ]),
        ),
      ),
    );
  }

  void _quickActions(BuildContext context, WidgetRef ref, String gigId) {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.bookmark_outline),
            title: const Text('Toggle bookmark'),
            onTap: () async {
              final saved = await ref.read(gigsBrowseMutationsProvider).toggleBookmark(gigId);
              if (context.mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(saved ? 'Bookmarked' : 'Removed')));
              }
            },
          ),
          ListTile(leading: const Icon(Icons.compare_arrows), title: const Text('Compare'), onTap: () => Navigator.pop(context)),
          ListTile(leading: const Icon(Icons.ios_share), title: const Text('Share'), onTap: () => Navigator.pop(context)),
        ]),
      ),
    );
  }
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({required this.initial, required this.onApply});
  final GigsBrowseQuery initial;
  final void Function(GigsBrowseQuery) onApply;
  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late GigsBrowseQuery _q = widget.initial;
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Filters', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          SwitchListTile(
            value: _q.proSellerOnly == true,
            title: const Text('Pro Sellers only'),
            onChanged: (v) => setState(() => _q = GigsBrowseQuery(q: _q.q, sort: _q.sort, proSellerOnly: v, fastDeliveryOnly: _q.fastDeliveryOnly, category: _q.category)),
          ),
          SwitchListTile(
            value: _q.fastDeliveryOnly == true,
            title: const Text('Fast delivery (24h)'),
            onChanged: (v) => setState(() => _q = GigsBrowseQuery(q: _q.q, sort: _q.sort, proSellerOnly: _q.proSellerOnly, fastDeliveryOnly: v, category: _q.category)),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () { widget.onApply(_q); Navigator.pop(context); },
              child: const Text('Apply filters'),
            ),
          ),
        ]),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) =>
      const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('No gigs match these filters yet.')));
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message; final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.error_outline, size: 36, color: Colors.redAccent),
        const SizedBox(height: 8),
        Padding(padding: const EdgeInsets.symmetric(horizontal: 24), child: Text(message, textAlign: TextAlign.center)),
        const SizedBox(height: 12),
        FilledButton(onPressed: onRetry, child: const Text('Retry')),
      ]));
}
