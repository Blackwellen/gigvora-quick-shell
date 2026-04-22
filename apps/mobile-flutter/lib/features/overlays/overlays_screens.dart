import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'overlays_api.dart';
import 'overlays_providers.dart';

class OverlaysInboxScreen extends ConsumerWidget {
  const OverlaysInboxScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overlays = ref.watch(openOverlaysProvider);
    final workflows = ref.watch(activeWorkflowsProvider);
    final windows = ref.watch(detachedWindowsProvider);

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Follow-throughs'),
          bottom: const TabBar(tabs: [
            Tab(text: 'Open'),
            Tab(text: 'Workflows'),
            Tab(text: 'Windows'),
          ]),
        ),
        body: TabBarView(children: [
          _list(context, ref, overlays, openOverlaysProvider, (i) => ListTile(
                leading: const Icon(Icons.layers),
                title: Text(i['surface_key']?.toString() ?? i['surfaceKey']?.toString() ?? '—'),
                subtitle: Text('${i['kind']} · ${i['status']}'),
                trailing: IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () async {
                    await ref.read(overlaysApiProvider).patch(i['id'].toString(), status: 'dismissed');
                    ref.invalidate(openOverlaysProvider);
                  },
                ),
              )),
          _list(context, ref, workflows, activeWorkflowsProvider, (i) => ListTile(
                leading: const Icon(Icons.account_tree),
                title: Text(i['template_key']?.toString() ?? i['templateKey']?.toString() ?? '—'),
                subtitle: Text('Step ${i['current_step'] ?? i['currentStep']} · ${i['status']}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/overlays/workflows/${i['id']}'),
              )),
          _list(context, ref, windows, detachedWindowsProvider, (i) => ListTile(
                leading: const Icon(Icons.open_in_new),
                title: Text(i['surface_key']?.toString() ?? '—'),
                subtitle: Text('${i['channel_key']} · ${i['route']}'),
                trailing: IconButton(
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () async {
                    await ref.read(overlaysApiProvider).closeWindow(i['channel_key'].toString());
                    ref.invalidate(detachedWindowsProvider);
                  },
                ),
              )),
        ]),
      ),
    );
  }

  Widget _list(
    BuildContext context, WidgetRef ref,
    AsyncValue<Map<String, dynamic>> async,
    ProviderBase<dynamic> p,
    Widget Function(Map item) builder,
  ) {
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(p),
      child: AsyncStateView<Map<String, dynamic>>(
        isLoading: async.isLoading,
        error: async.hasError ? async.error : null,
        data: async.value,
        isEmpty: ((async.value?['items'] as List?) ?? const []).isEmpty,
        onRetry: () => ref.invalidate(p),
        emptyTitle: 'Nothing open',
        builder: (data) {
          final items = (data['items'] as List).cast<Map>();
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) => builder(items[i]),
          );
        },
      ),
    );
  }
}

class WorkflowDetailScreen extends ConsumerWidget {
  final String id;
  const WorkflowDetailScreen({super.key, required this.id});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(workflowDetailProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Workflow')),
      body: AsyncStateView<Map<String, dynamic>>(
        isLoading: async.isLoading,
        error: async.hasError ? async.error : null,
        data: async.value,
        isEmpty: false,
        onRetry: () => ref.invalidate(workflowDetailProvider(id)),
        builder: (data) {
          final steps = ((data['steps'] as List?) ?? const []).cast<Map>();
          return ListView(padding: const EdgeInsets.all(16), children: [
            Text(data['template_key']?.toString() ?? data['templateKey']?.toString() ?? '—',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            Text('Status: ${data['status']}'),
            const SizedBox(height: 16),
            ...steps.map((s) {
              final done = s['status'] == 'completed';
              final open = s['status'] == 'open';
              return Card(
                child: ListTile(
                  leading: Icon(done
                      ? Icons.check_circle
                      : open
                          ? Icons.radio_button_checked
                          : Icons.radio_button_unchecked,
                      color: done ? Colors.green : null),
                  title: Text(s['step_key']?.toString() ?? '—'),
                  subtitle: Text('Position ${s['position']} · ${s['status']}'),
                  trailing: open
                      ? FilledButton(
                          onPressed: () async {
                            try {
                              await ref.read(overlaysApiProvider).advanceWorkflow(
                                    id, s['step_key'].toString(), status: 'completed');
                              ref.invalidate(workflowDetailProvider(id));
                              if (context.mounted) showSnack(context, 'Step completed');
                            } catch (e) {
                              if (context.mounted) showSnack(context, 'Failed: $e');
                            }
                          },
                          child: const Text('Complete'),
                        )
                      : null,
                ),
              );
            }),
          ]);
        },
      ),
    );
  }
}
