import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'recruiter_job_management_api.dart';

/// Domain 26 mobile parity:
///  - Recruiter dashboard list of requisitions.
///  - Sticky bottom bar with Approve / Pause / Publish quick actions.
///  - Swipe-to-archive; tap row → bottom sheet with state-machine actions.
final recruiterJobMgmtApiProvider =
    Provider<RecruiterJobManagementApi>((ref) => RecruiterJobManagementApi(ref.watch(apiClientProvider)));

final requisitionsProvider = FutureProvider<List<dynamic>>(
  (ref) async => (await ref.watch(recruiterJobMgmtApiProvider).list({'pageSize': 50}))['items'] as List,
);

class RecruiterJobManagementScreen extends ConsumerWidget {
  const RecruiterJobManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(requisitionsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Requisitions')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (rows) {
          if (rows.isEmpty) return const Center(child: Text('No requisitions yet.'));
          return ListView.separated(
            itemCount: rows.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final r = Map<String, dynamic>.from(rows[i] as Map);
              return Dismissible(
                key: ValueKey(r['id']),
                direction: DismissDirection.endToStart,
                background: Container(color: Colors.red, alignment: Alignment.centerRight, padding: const EdgeInsets.all(16), child: const Icon(Icons.archive, color: Colors.white)),
                confirmDismiss: (_) async {
                  await ref.read(recruiterJobMgmtApiProvider).transition(r['id'] as String, 'archived');
                  ref.invalidate(requisitionsProvider);
                  return false;
                },
                child: ListTile(
                  title: Text(r['title'] as String),
                  subtitle: Text('${r['department']} · ${r['location']} · ${r['status']}'),
                  trailing: Chip(label: Text('P${r['priorityScore'] ?? '—'}')),
                  onTap: () => showModalBottomSheet(
                    context: context,
                    builder: (_) => _ActionsSheet(requisitionId: r['id'] as String, status: r['status'] as String),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _ActionsSheet extends ConsumerWidget {
  final String requisitionId; final String status;
  const _ActionsSheet({required this.requisitionId, required this.status});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(recruiterJobMgmtApiProvider);
    Future<void> run(Future<void> Function() f) async {
      await f();
      ref.invalidate(requisitionsProvider);
      if (context.mounted) Navigator.pop(context);
    }
    return SafeArea(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        ListTile(leading: const Icon(Icons.send), title: const Text('Submit for approval'),
          enabled: status == 'draft',
          onTap: () => run(() async { await api.transition(requisitionId, 'pending_approval'); })),
        ListTile(leading: const Icon(Icons.check), title: const Text('Approve'),
          enabled: status == 'pending_approval',
          onTap: () => run(() async { await api.approve(requisitionId, 'approve'); })),
        ListTile(leading: const Icon(Icons.publish), title: const Text('Publish'),
          enabled: status == 'approved',
          onTap: () => run(() async { await api.publish(requisitionId, 'mob-${DateTime.now().millisecondsSinceEpoch}'); })),
        ListTile(leading: const Icon(Icons.pause), title: const Text('Pause'),
          enabled: status == 'opened',
          onTap: () => run(() async { await api.transition(requisitionId, 'paused'); })),
        ListTile(leading: const Icon(Icons.play_arrow), title: const Text('Resume'),
          enabled: status == 'paused',
          onTap: () => run(() async { await api.transition(requisitionId, 'opened'); })),
        ListTile(leading: const Icon(Icons.flag), title: const Text('Mark filled'),
          enabled: status == 'opened',
          onTap: () => run(() async { await api.transition(requisitionId, 'filled'); })),
        ListTile(leading: const Icon(Icons.cancel), title: const Text('Cancel'),
          onTap: () => run(() async { await api.transition(requisitionId, 'cancelled'); })),
      ]),
    );
  }
}
