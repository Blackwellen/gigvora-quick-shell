import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'marketing_providers.dart';

class MarketingPagesListScreen extends ConsumerStatefulWidget {
  const MarketingPagesListScreen({super.key});
  @override
  ConsumerState<MarketingPagesListScreen> createState() => _State();
}

class _State extends ConsumerState<MarketingPagesListScreen> {
  String _q = '';
  String? _status;

  @override
  Widget build(BuildContext context) {
    final args = MarketingPagesArgs(q: _q.isEmpty ? null : _q, status: _status);
    final async = ref.watch(marketingPagesProvider(args));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketing pages'),
        actions: [
          PopupMenuButton<String?>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) => setState(() => _status = v),
            itemBuilder: (_) => const [
              PopupMenuItem(value: null, child: Text('All statuses')),
              PopupMenuItem(value: 'draft', child: Text('Draft')),
              PopupMenuItem(value: 'published', child: Text('Published')),
              PopupMenuItem(value: 'archived', child: Text('Archived')),
            ],
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search title or slug',
                prefixIcon: Icon(Icons.search),
                isDense: true,
                border: OutlineInputBorder(),
              ),
              onSubmitted: (v) => setState(() => _q = v.trim()),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(marketingPagesProvider(args)),
        child: AsyncStateView<Map<String, dynamic>>(
          isLoading: async.isLoading,
          error: async.hasError ? async.error : null,
          data: async.value,
          isEmpty: ((async.value?['items'] as List?) ?? const []).isEmpty,
          onRetry: () => ref.invalidate(marketingPagesProvider(args)),
          emptyTitle: 'No pages',
          emptyMessage: 'No marketing pages match these filters.',
          builder: (data) {
            final items = (data['items'] as List).cast<Map>();
            return ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final p = items[i];
                return ListTile(
                  title: Text(p['title']?.toString() ?? '—'),
                  subtitle: Text('${p['surface']} · ${p['slug']} · ${p['status']}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/marketing/pages/${p['slug']}'),
                );
              },
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/marketing/leads'),
        icon: const Icon(Icons.inbox),
        label: const Text('Leads'),
      ),
    );
  }
}
