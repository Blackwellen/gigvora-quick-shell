import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'notifications_api.dart';
import 'notifications_providers.dart';

class NotificationsInboxScreen extends ConsumerWidget {
  const NotificationsInboxScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationsListProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(
            tooltip: 'Mark all read',
            icon: const Icon(Icons.done_all),
            onPressed: () async {
              await ref.read(notificationsApiProvider).markAllRead();
              ref.invalidate(notificationsListProvider);
              ref.invalidate(unreadCountProvider);
            },
          ),
          IconButton(
            tooltip: 'Preferences',
            icon: const Icon(Icons.tune),
            onPressed: () => context.push('/notifications/preferences'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(notificationsListProvider),
        child: AsyncStateView<Map<String, dynamic>>(
          isLoading: async.isLoading,
          error: async.hasError ? async.error : null,
          data: async.value,
          isEmpty: ((async.value?['items'] as List?) ?? const []).isEmpty,
          onRetry: () => ref.invalidate(notificationsListProvider),
          emptyTitle: 'No notifications',
          emptyMessage: 'You are all caught up.',
          builder: (data) {
            final items = (data['items'] as List).cast<Map>();
            return ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final n = items[i];
                final read = n['read_at'] != null || n['readAt'] != null;
                return Dismissible(
                  key: ValueKey(n['id']),
                  background: Container(color: Colors.green, alignment: Alignment.centerLeft, padding: const EdgeInsets.all(16), child: const Icon(Icons.check, color: Colors.white)),
                  secondaryBackground: Container(color: Colors.red, alignment: Alignment.centerRight, padding: const EdgeInsets.all(16), child: const Icon(Icons.delete, color: Colors.white)),
                  onDismissed: (dir) async {
                    if (dir == DismissDirection.startToEnd) {
                      await ref.read(notificationsApiProvider).markRead([n['id'].toString()]);
                    } else {
                      await ref.read(notificationsApiProvider).dismiss(n['id'].toString());
                    }
                    ref.invalidate(notificationsListProvider);
                    ref.invalidate(unreadCountProvider);
                  },
                  child: ListTile(
                    leading: CircleAvatar(child: Icon(read ? Icons.notifications_none : Icons.notifications_active)),
                    title: Text(n['title']?.toString() ?? n['topic']?.toString() ?? '—',
                        style: TextStyle(fontWeight: read ? FontWeight.normal : FontWeight.bold)),
                    subtitle: Text(n['body']?.toString() ?? ''),
                    trailing: Text(n['created_at']?.toString().substring(0, 10) ?? ''),
                    onTap: () async {
                      if (!read) {
                        await ref.read(notificationsApiProvider).markRead([n['id'].toString()]);
                        ref.invalidate(notificationsListProvider);
                        ref.invalidate(unreadCountProvider);
                      }
                      final url = n['action_url']?.toString() ?? n['actionUrl']?.toString();
                      if (url != null && url.startsWith('/') && context.mounted) context.push(url);
                    },
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class NotificationPreferencesScreen extends ConsumerWidget {
  const NotificationPreferencesScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(notificationPrefsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Notification preferences')),
      body: AsyncStateView<Map<String, dynamic>>(
        isLoading: async.isLoading,
        error: async.hasError ? async.error : null,
        data: async.value,
        isEmpty: false,
        onRetry: () => ref.invalidate(notificationPrefsProvider),
        builder: (data) {
          final items = ((data['items'] as List?) ?? const []).cast<Map>();
          if (items.isEmpty) {
            return const Center(child: Padding(
              padding: EdgeInsets.all(24),
              child: Text('No preferences yet — defaults will be used (in-app only).'),
            ));
          }
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final p = items[i];
              final channels = ((p['channels'] as List?) ?? const []).cast<String>();
              return ExpansionTile(
                leading: const Icon(Icons.topic),
                title: Text(p['topic']?.toString() ?? '—'),
                subtitle: Text('Digest: ${p['digest'] ?? 'realtime'}'),
                children: ['in_app', 'email', 'push', 'sms'].map((ch) {
                  final on = channels.contains(ch);
                  return SwitchListTile(
                    title: Text(ch),
                    value: on,
                    onChanged: (v) async {
                      final next = [...channels];
                      if (v) {
                        if (!next.contains(ch)) next.add(ch);
                      } else {
                        next.remove(ch);
                      }
                      await ref.read(notificationsApiProvider).upsertPreference(
                            topic: p['topic'].toString(), channels: next,
                            digest: p['digest']?.toString() ?? 'realtime',
                          );
                      ref.invalidate(notificationPrefsProvider);
                    },
                  );
                }).toList(),
              );
            },
          );
        },
      ),
    );
  }
}
