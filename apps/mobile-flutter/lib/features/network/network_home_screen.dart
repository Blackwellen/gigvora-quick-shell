import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'network_api.dart';
import 'network_providers.dart';

/// Domain 10 — Network home: tabs for People (connections), Requests, Suggestions, Blocks.
class NetworkHomeScreen extends ConsumerWidget {
  const NetworkHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Network'),
          bottom: const TabBar(tabs: [
            Tab(text: 'People'),
            Tab(text: 'Requests'),
            Tab(text: 'Suggestions'),
            Tab(text: 'Blocks'),
          ]),
        ),
        body: const TabBarView(children: [
          _ConnectionsTab(),
          _RequestsTab(),
          _SuggestionsTab(),
          _BlocksTab(),
        ]),
      ),
    );
  }
}

class _ConnectionsTab extends ConsumerWidget {
  const _ConnectionsTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conns = ref.watch(networkConnectionsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(networkConnectionsProvider),
      child: AsyncStateView<NetworkPage>(
        isLoading: conns.isLoading,
        error: conns.hasError ? conns.error : null,
        data: conns.valueOrNull,
        isEmpty: (conns.valueOrNull?.items.isEmpty ?? true),
        onRetry: () => ref.invalidate(networkConnectionsProvider),
        emptyTitle: 'No connections yet',
        emptyMessage: 'Send a connection request from the Suggestions tab.',
        emptyIcon: Icons.group_outlined,
        builder: (page) => ListView.separated(
          itemCount: page.items.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (_, i) {
            final c = page.items[i];
            final id = (c['user_id'] ?? '').toString();
            return ListTile(
              leading: CircleAvatar(child: Text(id.isEmpty ? '?' : id.substring(0, 1).toUpperCase())),
              title: Text('Connection $id'),
              subtitle: const Text('1° connection'),
              trailing: IconButton(
                icon: const Icon(Icons.more_vert),
                onPressed: () => _connectionActions(context, ref, id),
              ),
            );
          },
        ),
      ),
    );
  }

  void _connectionActions(BuildContext context, WidgetRef ref, String id) {
    showModalBottomSheet(context: context, builder: (_) => SafeArea(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        ListTile(
          leading: const Icon(Icons.person_remove_outlined),
          title: const Text('Remove connection'),
          onTap: () async {
            Navigator.of(context).pop();
            final ok = await confirmAction(context,
              title: 'Remove connection?', message: 'They will no longer appear in your network.',
              confirmLabel: 'Remove', destructive: true);
            if (ok) {
              await ref.read(networkApiProvider).remove(id);
              ref.invalidate(networkConnectionsProvider);
              if (context.mounted) showSnack(context, 'Connection removed');
            }
          },
        ),
        ListTile(
          leading: const Icon(Icons.block),
          title: const Text('Block'),
          onTap: () async {
            Navigator.of(context).pop();
            final ok = await confirmAction(context,
              title: 'Block this person?', message: 'They will not be able to send you requests.',
              confirmLabel: 'Block', destructive: true);
            if (ok) {
              await ref.read(networkApiProvider).block(id);
              ref.invalidate(networkConnectionsProvider);
              ref.invalidate(networkBlocksProvider);
              if (context.mounted) showSnack(context, 'Blocked');
            }
          },
        ),
      ]),
    ));
  }
}

class _RequestsTab extends ConsumerStatefulWidget {
  const _RequestsTab();
  @override
  ConsumerState<_RequestsTab> createState() => _RequestsTabState();
}

class _RequestsTabState extends ConsumerState<_RequestsTab> {
  String _direction = 'incoming';

  @override
  Widget build(BuildContext context) {
    final args = (direction: _direction, status: 'pending');
    final reqs = ref.watch(networkRequestsProvider(args));
    return Column(children: [
      Padding(
        padding: const EdgeInsets.all(8),
        child: SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'incoming', label: Text('Incoming')),
            ButtonSegment(value: 'outgoing', label: Text('Outgoing')),
          ],
          selected: {_direction},
          onSelectionChanged: (s) => setState(() => _direction = s.first),
        ),
      ),
      Expanded(
        child: RefreshIndicator(
          onRefresh: () async => ref.invalidate(networkRequestsProvider(args)),
          child: AsyncStateView<NetworkPage>(
            isLoading: reqs.isLoading,
            error: reqs.hasError ? reqs.error : null,
            data: reqs.valueOrNull,
            isEmpty: (reqs.valueOrNull?.items.isEmpty ?? true),
            onRetry: () => ref.invalidate(networkRequestsProvider(args)),
            emptyTitle: 'No pending requests',
            emptyIcon: Icons.mail_outline,
            builder: (page) => ListView.separated(
              itemCount: page.items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final req = page.items[i];
                final id = req['id'].toString();
                final other = (_direction == 'incoming' ? req['requester_id'] : req['recipient_id']).toString();
                final msg = req['message']?.toString();
                return ListTile(
                  leading: CircleAvatar(child: Text(other.substring(0, 1).toUpperCase())),
                  title: Text(other),
                  subtitle: msg == null || msg.isEmpty ? null : Text(msg, maxLines: 2, overflow: TextOverflow.ellipsis),
                  trailing: _direction == 'incoming'
                      ? Row(mainAxisSize: MainAxisSize.min, children: [
                          IconButton(
                            icon: const Icon(Icons.check_circle, color: Colors.green),
                            onPressed: () async {
                              await ref.read(networkApiProvider).respond(id, 'accept');
                              ref.invalidate(networkRequestsProvider(args));
                              ref.invalidate(networkConnectionsProvider);
                              if (context.mounted) showSnack(context, 'Connected');
                            },
                          ),
                          IconButton(
                            icon: const Icon(Icons.cancel_outlined),
                            onPressed: () async {
                              await ref.read(networkApiProvider).respond(id, 'decline');
                              ref.invalidate(networkRequestsProvider(args));
                            },
                          ),
                        ])
                      : IconButton(
                          icon: const Icon(Icons.undo),
                          onPressed: () async {
                            final ok = await confirmAction(context,
                              title: 'Withdraw request?',
                              message: 'They will no longer see your invite.',
                              confirmLabel: 'Withdraw', destructive: true);
                            if (ok) {
                              await ref.read(networkApiProvider).withdraw(id);
                              ref.invalidate(networkRequestsProvider(args));
                            }
                          },
                        ),
                );
              },
            ),
          ),
        ),
      ),
    ]);
  }
}

class _SuggestionsTab extends ConsumerWidget {
  const _SuggestionsTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(networkSuggestionsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(networkSuggestionsProvider),
      child: AsyncStateView<NetworkPage>(
        isLoading: s.isLoading,
        error: s.hasError ? s.error : null,
        data: s.valueOrNull,
        isEmpty: (s.valueOrNull?.items.isEmpty ?? true),
        onRetry: () => ref.invalidate(networkSuggestionsProvider),
        emptyTitle: 'No suggestions yet',
        emptyMessage: 'As you connect with more people, suggestions appear here.',
        emptyIcon: Icons.recommend_outlined,
        builder: (page) => ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: page.items.length,
          itemBuilder: (_, i) {
            final s = page.items[i];
            final id = (s['user_id'] ?? '').toString();
            final mutual = (s['mutual_count'] ?? 0) as int;
            final degree = (s['degree'] ?? 2) as int;
            return Card(
              child: ListTile(
                leading: CircleAvatar(child: Text(id.isEmpty ? '?' : id.substring(0, 1).toUpperCase())),
                title: Text(id),
                subtitle: Text('$degree° · $mutual mutual'),
                trailing: FilledButton.tonal(
                  onPressed: () => _showConnectSheet(context, ref, id),
                  child: const Text('Connect'),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _showConnectSheet(BuildContext context, WidgetRef ref, String id) {
    final ctrl = TextEditingController();
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          left: 16, right: 16, top: 16,
          bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('Connect with $id', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          TextField(
            controller: ctrl, maxLines: 4, maxLength: 1000,
            decoration: const InputDecoration(
              labelText: 'Optional message', border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          FilledButton(
            onPressed: () async {
              try {
                await ref.read(networkApiProvider).sendRequest(
                  id,
                  message: ctrl.text.trim().isEmpty ? null : ctrl.text.trim(),
                  idempotencyKey: 'req-$id-${DateTime.now().millisecondsSinceEpoch}',
                );
                if (context.mounted) { Navigator.of(context).pop(); showSnack(context, 'Request sent'); }
                ref.invalidate(networkSuggestionsProvider);
              } catch (e) {
                if (context.mounted) showSnack(context, 'Could not send: $e');
              }
            },
            child: const Text('Send request'),
          ),
        ]),
      ),
    );
  }
}

class _BlocksTab extends ConsumerWidget {
  const _BlocksTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final b = ref.watch(networkBlocksProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(networkBlocksProvider),
      child: AsyncStateView<List<Map<String, dynamic>>>(
        isLoading: b.isLoading,
        error: b.hasError ? b.error : null,
        data: b.valueOrNull,
        isEmpty: (b.valueOrNull?.isEmpty ?? true),
        onRetry: () => ref.invalidate(networkBlocksProvider),
        emptyTitle: 'No blocked people',
        emptyIcon: Icons.shield_outlined,
        builder: (list) => ListView.separated(
          itemCount: list.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (_, i) {
            final row = list[i];
            final id = (row['blocked_id'] ?? '').toString();
            return ListTile(
              leading: CircleAvatar(child: Text(id.isEmpty ? '?' : id.substring(0, 1).toUpperCase())),
              title: Text(id),
              subtitle: row['reason'] != null ? Text(row['reason'].toString()) : null,
              trailing: TextButton(
                onPressed: () async {
                  await ref.read(networkApiProvider).unblock(id);
                  ref.invalidate(networkBlocksProvider);
                  if (context.mounted) showSnack(context, 'Unblocked');
                },
                child: const Text('Unblock'),
              ),
            );
          },
        ),
      ),
    );
  }
}
