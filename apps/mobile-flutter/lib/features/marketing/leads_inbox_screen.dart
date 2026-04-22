import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/async_state.dart';
import 'marketing_providers.dart';

class LeadsInboxScreen extends ConsumerStatefulWidget {
  const LeadsInboxScreen({super.key});
  @override
  ConsumerState<LeadsInboxScreen> createState() => _State();
}

class _State extends ConsumerState<LeadsInboxScreen> {
  String? _status;
  @override
  Widget build(BuildContext context) {
    final async = ref.watch(marketingLeadsProvider(_status));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Leads'),
        actions: [
          PopupMenuButton<String?>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) => setState(() => _status = v),
            itemBuilder: (_) => const [
              PopupMenuItem(value: null, child: Text('All')),
              PopupMenuItem(value: 'new', child: Text('New')),
              PopupMenuItem(value: 'qualified', child: Text('Qualified')),
              PopupMenuItem(value: 'archived', child: Text('Archived')),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(marketingLeadsProvider(_status)),
        child: AsyncStateView<Map<String, dynamic>>(
          isLoading: async.isLoading,
          error: async.hasError ? async.error : null,
          data: async.value,
          isEmpty: ((async.value?['items'] as List?) ?? const []).isEmpty,
          onRetry: () => ref.invalidate(marketingLeadsProvider(_status)),
          emptyTitle: 'No leads yet',
          emptyMessage: 'Inbound leads will appear here.',
          builder: (data) {
            final items = (data['items'] as List).cast<Map>();
            return ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final l = items[i];
                return ListTile(
                  leading: CircleAvatar(child: Text((l['email']?.toString() ?? '?')[0].toUpperCase())),
                  title: Text(l['fullName']?.toString() ?? l['email']?.toString() ?? '—'),
                  subtitle: Text('${l['company'] ?? '—'} · ${l['sourcePage'] ?? '—'}'),
                  trailing: Chip(label: Text(l['status']?.toString() ?? '—')),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
