import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'search_api.dart';
import 'search_providers.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchState();
}

class _SearchState extends ConsumerState<SearchScreen> {
  final _ctrl = TextEditingController();
  Timer? _debounce;
  String _q = '';
  String? _scope;

  @override
  void dispose() { _debounce?.cancel(); _ctrl.dispose(); super.dispose(); }

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () {
      if (mounted) setState(() => _q = v.trim());
    });
  }

  @override
  Widget build(BuildContext context) {
    final results = ref.watch(searchResultsProvider(SearchQuery(_q, scope: _scope)));
    final recent = ref.watch(recentSearchesProvider);
    final trending = ref.watch(trendingSearchesProvider);

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _ctrl,
          autofocus: true,
          onChanged: _onChanged,
          decoration: const InputDecoration(border: InputBorder.none, hintText: 'Search everything…'),
        ),
        actions: [
          if (_q.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.bookmark_add_outlined),
              tooltip: 'Save search',
              onPressed: _saveSearch,
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: ['all', 'users', 'jobs', 'projects', 'gigs', 'services', 'companies', 'media']
                  .map((s) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: ChoiceChip(
                          label: Text(s),
                          selected: (_scope ?? 'all') == s,
                          onSelected: (_) => setState(() => _scope = s == 'all' ? null : s),
                        ),
                      ))
                  .toList(),
            ),
          ),
        ),
      ),
      body: _q.isEmpty ? _buildIdle(recent, trending) : _buildResults(results),
    );
  }

  Widget _buildIdle(AsyncValue<Map<String, dynamic>> recent, AsyncValue<Map<String, dynamic>> trending) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Trending', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8, runSpacing: 8,
          children: ((trending.value?['items'] as List?) ?? const [])
              .take(10)
              .map((t) => ActionChip(
                    label: Text(t['query']?.toString() ?? t.toString()),
                    onPressed: () { _ctrl.text = t['query']?.toString() ?? ''; setState(() => _q = _ctrl.text); },
                  ))
              .toList(),
        ),
        const SizedBox(height: 24),
        Text('Recent', style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 8),
        ...((recent.value?['items'] as List?) ?? const []).take(10).map((r) => ListTile(
              leading: const Icon(Icons.history),
              title: Text(r['query']?.toString() ?? '—'),
              subtitle: Text(r['scope']?.toString() ?? 'all'),
              onTap: () { _ctrl.text = r['query']?.toString() ?? ''; setState(() => _q = _ctrl.text); },
            )),
        const SizedBox(height: 16),
        ListTile(
          leading: const Icon(Icons.bookmark_outline),
          title: const Text('Saved searches'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.push('/search/saved'),
        ),
        ListTile(
          leading: const Icon(Icons.bolt_outlined),
          title: const Text('Command palette'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.push('/search/palette'),
        ),
      ],
    );
  }

  Widget _buildResults(AsyncValue<Map<String, dynamic>> async) {
    return AsyncStateView<Map<String, dynamic>>(
      isLoading: async.isLoading,
      error: async.hasError ? async.error : null,
      data: async.value,
      isEmpty: ((async.value?['items'] as List?) ?? const []).isEmpty,
      onRetry: () => ref.invalidate(searchResultsProvider(SearchQuery(_q, scope: _scope))),
      emptyTitle: 'No matches',
      emptyMessage: 'Try a different query or scope.',
      builder: (data) {
        final items = (data['items'] as List).cast<Map>();
        return ListView.separated(
          itemCount: items.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (_, i) {
            final r = items[i];
            return ListTile(
              leading: const Icon(Icons.search),
              title: Text(r['title']?.toString() ?? '—'),
              subtitle: Text('${r['indexName']} · ${(r['tags'] as List?)?.join(', ') ?? ''}'),
              onTap: () async {
                await ref.read(searchApiProvider).trackClick(
                      query: _q,
                      clickedId: r['id'].toString(),
                      clickedIndex: r['indexName'].toString(),
                      scope: _scope,
                    );
                if (!mounted) return;
                final url = r['url']?.toString();
                if (url != null && url.startsWith('/')) context.push(url);
              },
            );
          },
        );
      },
    );
  }

  Future<void> _saveSearch() async {
    final name = await showDialog<String>(
      context: context,
      builder: (_) {
        final c = TextEditingController(text: _q);
        return AlertDialog(
          title: const Text('Save search'),
          content: TextField(controller: c, decoration: const InputDecoration(labelText: 'Name')),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            FilledButton(onPressed: () => Navigator.pop(context, c.text), child: const Text('Save')),
          ],
        );
      },
    );
    if (name == null || name.isEmpty) return;
    try {
      await ref.read(searchApiProvider).saveSearch(
            name: name, query: _q, scope: _scope,
            idempotencyKey: 'save-$name-${DateTime.now().millisecondsSinceEpoch}',
          );
      ref.invalidate(savedSearchesProvider);
      if (mounted) showSnack(context, 'Saved');
    } catch (e) {
      if (mounted) showSnack(context, 'Failed: $e');
    }
  }
}

class SavedSearchesScreen extends ConsumerWidget {
  const SavedSearchesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(savedSearchesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Saved searches')),
      body: AsyncStateView<Map<String, dynamic>>(
        isLoading: async.isLoading,
        error: async.hasError ? async.error : null,
        data: async.value,
        isEmpty: ((async.value?['items'] as List?) ?? const []).isEmpty,
        onRetry: () => ref.invalidate(savedSearchesProvider),
        emptyTitle: 'No saved searches',
        builder: (data) {
          final items = (data['items'] as List).cast<Map>();
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final s = items[i];
              return ListTile(
                leading: Icon(s['pinned'] == true ? Icons.push_pin : Icons.bookmark),
                title: Text(s['name']?.toString() ?? '—'),
                subtitle: Text('${s['query']} · ${s['scope'] ?? 'all'}'),
              );
            },
          );
        },
      ),
    );
  }
}

class CommandPaletteScreen extends ConsumerWidget {
  const CommandPaletteScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(paletteActionsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Command palette')),
      body: AsyncStateView<List<dynamic>>(
        isLoading: async.isLoading,
        error: async.hasError ? async.error : null,
        data: async.value,
        isEmpty: (async.value ?? const []).isEmpty,
        onRetry: () => ref.invalidate(paletteActionsProvider),
        emptyTitle: 'No actions available',
        builder: (items) {
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final a = items[i] as Map;
              return ListTile(
                leading: const Icon(Icons.bolt),
                title: Text(a['label']?.toString() ?? a['key'].toString()),
                subtitle: Text('${a['category'] ?? ''} · ${a['route'] ?? ''}'),
                onTap: () {
                  final route = a['route']?.toString();
                  if (route != null && route.startsWith('/')) context.push(route);
                },
              );
            },
          );
        },
      ),
    );
  }
}
