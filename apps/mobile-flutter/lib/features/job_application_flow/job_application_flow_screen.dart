import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'job_application_flow_api.dart';

/// Domain 25 mobile parity:
///  - Candidate: 3-step apply flow (Form → Review → Submitted) with sticky CTA
///  - Recruiter: review queue list with swipe-advance / swipe-reject and a
///    bottom-sheet decision form (stage + scorecard + note).
final appFlowApiProvider = Provider<JobApplicationFlowApi>((ref) => JobApplicationFlowApi(ref.watch(apiClientProvider)));
final reviewQueueProvider = FutureProvider<List<dynamic>>((ref) => ref.watch(appFlowApiProvider).reviewQueue());

class JobApplicationFlowScreen extends ConsumerWidget {
  const JobApplicationFlowScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(reviewQueueProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Application Reviews')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (rows) {
          if (rows.isEmpty) return const Center(child: Text('Queue is empty.'));
          return ListView.separated(
            itemCount: rows.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final a = Map<String, dynamic>.from(rows[i] as Map);
              final cand = Map<String, dynamic>.from(a['candidate'] as Map);
              return Dismissible(
                key: ValueKey(a['id']),
                background: Container(color: Colors.green, alignment: Alignment.centerLeft, padding: const EdgeInsets.all(16), child: const Icon(Icons.arrow_forward, color: Colors.white)),
                secondaryBackground: Container(color: Colors.red, alignment: Alignment.centerRight, padding: const EdgeInsets.all(16), child: const Icon(Icons.close, color: Colors.white)),
                confirmDismiss: (dir) async {
                  final api = ref.read(appFlowApiProvider);
                  await api.decide(a['id'] as String, {
                    'decision': dir == DismissDirection.startToEnd ? 'advance' : 'reject',
                    'stage': 'screening',
                  });
                  ref.invalidate(reviewQueueProvider);
                  return false;
                },
                child: ListTile(
                  title: Text(cand['name'] as String),
                  subtitle: Text('${a['status']} · score ${a['qualityScore'] ?? '—'}'),
                  trailing: Chip(label: Text(a['status'] as String)),
                  onTap: () => showModalBottomSheet(
                    context: context,
                    builder: (_) => _DecideSheet(applicationId: a['id'] as String),
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

class _DecideSheet extends ConsumerStatefulWidget {
  final String applicationId;
  const _DecideSheet({required this.applicationId});
  @override ConsumerState<_DecideSheet> createState() => _DS();
}
class _DS extends ConsumerState<_DecideSheet> {
  String stage = 'screening';
  String decision = 'advance';
  final note = TextEditingController();
  double overall = 7;

  Future<void> submit() async {
    await ref.read(appFlowApiProvider).decide(widget.applicationId, {
      'decision': decision, 'stage': stage, 'note': note.text,
      'scorecard': {'overall': overall},
    });
    if (mounted) {
      ref.invalidate(reviewQueueProvider);
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        DropdownButton<String>(value: stage, items: const [
          DropdownMenuItem(value: 'screening', child: Text('Screening')),
          DropdownMenuItem(value: 'interview', child: Text('Interview')),
          DropdownMenuItem(value: 'final', child: Text('Final')),
          DropdownMenuItem(value: 'offer', child: Text('Offer')),
        ], onChanged: (v) => setState(() => stage = v!)),
        DropdownButton<String>(value: decision, items: const [
          DropdownMenuItem(value: 'advance', child: Text('Advance')),
          DropdownMenuItem(value: 'hold', child: Text('Hold')),
          DropdownMenuItem(value: 'reject', child: Text('Reject')),
          DropdownMenuItem(value: 'offer', child: Text('Offer')),
        ], onChanged: (v) => setState(() => decision = v!)),
        Row(children: [const Text('Overall'), Expanded(child: Slider(value: overall, min: 0, max: 10, divisions: 10, label: overall.toStringAsFixed(0), onChanged: (v) => setState(() => overall = v)))]),
        TextField(controller: note, decoration: const InputDecoration(labelText: 'Note'), maxLines: 3),
        const SizedBox(height: 12),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: submit, child: const Text('Submit decision'))),
      ]),
    );
  }
}
