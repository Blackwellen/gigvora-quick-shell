import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'settings_api.dart';
import 'settings_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(settingsListProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        actions: [
          IconButton(icon: const Icon(Icons.link), tooltip: 'Connections', onPressed: () => context.push('/settings/connections')),
          IconButton(icon: const Icon(Icons.privacy_tip_outlined), tooltip: 'Data requests', onPressed: () => context.push('/settings/data-requests')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(settingsListProvider),
        child: AsyncStateView<Map<String, dynamic>>(
          isLoading: async.isLoading,
          error: async.hasError ? async.error : null,
          data: async.value,
          isEmpty: false,
          onRetry: () => ref.invalidate(settingsListProvider),
          builder: (data) {
            final items = ((data['items'] as List?) ?? const []).cast<Map>();
            // Group by namespace
            final groups = <String, List<Map>>{};
            for (final s in items) {
              groups.putIfAbsent(s['namespace']?.toString() ?? 'general', () => []).add(s);
            }
            const namespaces = ['general', 'locale', 'accessibility', 'privacy', 'profile', 'connections'];
            return ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: namespaces.map((ns) {
                final entries = groups[ns] ?? const [];
                return ExpansionTile(
                  leading: Icon(_iconFor(ns)),
                  title: Text(ns[0].toUpperCase() + ns.substring(1)),
                  subtitle: Text('${entries.length} setting${entries.length == 1 ? '' : 's'}'),
                  initiallyExpanded: ns == 'general',
                  children: [
                    ...entries.map((s) => _SettingRow(setting: s)),
                    if (entries.isEmpty)
                      const Padding(
                        padding: EdgeInsets.fromLTRB(16, 4, 16, 12),
                        child: Text('No overrides — defaults apply.', style: TextStyle(color: Colors.grey)),
                      ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                      child: TextButton.icon(
                        icon: const Icon(Icons.refresh, size: 18),
                        label: Text('Reset $ns to defaults'),
                        onPressed: () => _confirmReset(context, ref, ns),
                      ),
                    ),
                  ],
                );
              }).toList(),
            );
          },
        ),
      ),
    );
  }

  IconData _iconFor(String ns) => switch (ns) {
        'general' => Icons.tune,
        'locale' => Icons.language,
        'accessibility' => Icons.accessibility_new,
        'privacy' => Icons.lock_outline,
        'profile' => Icons.person_outline,
        'connections' => Icons.link,
        _ => Icons.settings,
      };

  Future<void> _confirmReset(BuildContext context, WidgetRef ref, String ns) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Reset $ns?'),
        content: const Text('This restores defaults for this namespace. You can re-customise at any time.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Reset')),
        ],
      ),
    );
    if (ok == true) {
      await ref.read(settingsApiProvider).resetNamespace(ns);
      ref.invalidate(settingsListProvider);
      if (context.mounted) showSnack(context, 'Reset $ns');
    }
  }
}

class _SettingRow extends ConsumerWidget {
  final Map setting;
  const _SettingRow({required this.setting});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ns = setting['namespace']?.toString() ?? '';
    final key = setting['key']?.toString() ?? '';
    final value = setting['value'];
    final isBool = value is bool;
    if (isBool) {
      return SwitchListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 24),
        title: Text(_label(key)),
        value: value,
        onChanged: (v) async {
          await ref.read(settingsApiProvider).upsert(namespace: ns, key: key, value: v);
          ref.invalidate(settingsListProvider);
        },
      );
    }
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 24),
      title: Text(_label(key)),
      subtitle: Text(value?.toString() ?? '—'),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => _editValue(context, ref, ns, key, value),
    );
  }

  String _label(String key) => key.replaceAll('_', ' ').replaceAllMapped(RegExp(r'^.'), (m) => m.group(0)!.toUpperCase());

  Future<void> _editValue(BuildContext context, WidgetRef ref, String ns, String key, Object? current) async {
    final ctrl = TextEditingController(text: current?.toString() ?? '');
    final val = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('$ns.$key'),
        content: TextField(controller: ctrl, decoration: const InputDecoration(labelText: 'Value')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, ctrl.text), child: const Text('Save')),
        ],
      ),
    );
    if (val == null) return;
    Object? parsed = val;
    if (val == 'true') parsed = true;
    else if (val == 'false') parsed = false;
    else if (double.tryParse(val) != null) parsed = double.parse(val);
    try {
      await ref.read(settingsApiProvider).upsert(namespace: ns, key: key, value: parsed);
      ref.invalidate(settingsListProvider);
      if (context.mounted) showSnack(context, 'Saved');
    } catch (e) {
      if (context.mounted) showSnack(context, 'Failed: $e');
    }
  }
}

class ConnectionsScreen extends ConsumerWidget {
  const ConnectionsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(connectionsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Connected accounts')),
      body: AsyncStateView<Map<String, dynamic>>(
        isLoading: async.isLoading,
        error: async.hasError ? async.error : null,
        data: async.value,
        isEmpty: ((async.value?['items'] as List?) ?? const []).isEmpty,
        onRetry: () => ref.invalidate(connectionsProvider),
        emptyTitle: 'No connections',
        emptyMessage: 'Link Google, GitHub, LinkedIn, or other providers from the web app.',
        builder: (data) {
          final items = (data['items'] as List).cast<Map>();
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final c = items[i];
              return Dismissible(
                key: ValueKey(c['id']),
                direction: DismissDirection.endToStart,
                background: Container(color: Colors.red, alignment: Alignment.centerRight, padding: const EdgeInsets.all(16), child: const Icon(Icons.delete, color: Colors.white)),
                confirmDismiss: (_) async {
                  return await showDialog<bool>(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text('Revoke connection?'),
                      content: Text('Disconnect ${c['provider']}?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                        FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Revoke')),
                      ],
                    ),
                  );
                },
                onDismissed: (_) async {
                  await ref.read(settingsApiProvider).revokeConnection(c['id'].toString());
                  ref.invalidate(connectionsProvider);
                },
                child: ListTile(
                  leading: const Icon(Icons.link),
                  title: Text(c['provider']?.toString() ?? '—'),
                  subtitle: Text(c['display_name']?.toString() ?? c['external_id']?.toString() ?? ''),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class DataRequestsScreen extends ConsumerWidget {
  const DataRequestsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(dataRequestsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Data & privacy')),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('New request'),
        onPressed: () => _newRequest(context, ref),
      ),
      body: AsyncStateView<Map<String, dynamic>>(
        isLoading: async.isLoading,
        error: async.hasError ? async.error : null,
        data: async.value,
        isEmpty: ((async.value?['items'] as List?) ?? const []).isEmpty,
        onRetry: () => ref.invalidate(dataRequestsProvider),
        emptyTitle: 'No requests yet',
        emptyMessage: 'Request an export, rectification, or full erasure of your data.',
        builder: (data) {
          final items = (data['items'] as List).cast<Map>();
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final r = items[i];
              final status = r['status']?.toString() ?? 'pending';
              return ListTile(
                leading: Icon(switch (r['kind']) {
                  'export' => Icons.download,
                  'erasure' => Icons.delete_forever,
                  'rectification' => Icons.edit,
                  _ => Icons.description,
                }),
                title: Text(r['kind']?.toString() ?? '—'),
                subtitle: Text('Requested ${r['requested_at']?.toString().substring(0, 10) ?? '—'}'),
                trailing: Chip(label: Text(status), backgroundColor: status == 'completed' ? Colors.green.shade100 : null),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _newRequest(BuildContext context, WidgetRef ref) async {
    final kind = await showModalBottomSheet<String>(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const ListTile(title: Text('Type of request', style: TextStyle(fontWeight: FontWeight.bold))),
            ListTile(leading: const Icon(Icons.download), title: const Text('Export my data'), onTap: () => Navigator.pop(context, 'export')),
            ListTile(leading: const Icon(Icons.edit), title: const Text('Rectify my data'), onTap: () => Navigator.pop(context, 'rectification')),
            ListTile(leading: const Icon(Icons.delete_forever), title: const Text('Erase my account'), onTap: () => Navigator.pop(context, 'erasure')),
          ],
        ),
      ),
    );
    if (kind == null) return;
    try {
      await ref.read(settingsApiProvider).createDataRequest(
            kind: kind,
            idempotencyKey: 'data-req-$kind-${DateTime.now().millisecondsSinceEpoch}',
          );
      ref.invalidate(dataRequestsProvider);
      if (context.mounted) showSnack(context, 'Request submitted');
    } catch (e) {
      if (context.mounted) showSnack(context, 'Failed: $e');
    }
  }
}
