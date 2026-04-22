import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'interview_planning_api.dart';

/// Domain 29 mobile parity:
///  - Tab 1: Upcoming interviews (pull-to-refresh, RSVP swipe).
///  - Tab 2: My scorecards (compact rating sheet).
///  - Bottom-sheet actions for state machine transitions.
final interviewApiProvider = Provider<InterviewPlanningApi>(
  (ref) => InterviewPlanningApi(ref.watch(apiClientProvider)),
);

final upcomingInterviewsProvider = FutureProvider<List<dynamic>>((ref) async {
  final res = await ref.watch(interviewApiProvider).listInterviews({
    'pageSize': 50,
    'status': ['scheduled', 'confirmed'],
    'sort': 'startAt',
  });
  return res['items'] as List;
});

final myScorecardsProvider = FutureProvider<List<dynamic>>((ref) async {
  final res = await ref.watch(interviewApiProvider).listScorecards({});
  return res['items'] as List;
});

class InterviewPlanningScreen extends ConsumerWidget {
  const InterviewPlanningScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Interviews'),
          bottom: const TabBar(tabs: [Tab(text: 'Upcoming'), Tab(text: 'Scorecards')]),
        ),
        body: const TabBarView(children: [_UpcomingTab(), _ScorecardsTab()]),
      ),
    );
  }
}

class _UpcomingTab extends ConsumerWidget {
  const _UpcomingTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(upcomingInterviewsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(upcomingInterviewsProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ListView(children: [
          Padding(padding: const EdgeInsets.all(24), child: Text('Error: $e')),
        ]),
        data: (rows) {
          if (rows.isEmpty) {
            return ListView(children: const [
              Padding(padding: EdgeInsets.all(48), child: Center(child: Text('No upcoming interviews.'))),
            ]);
          }
          return ListView.separated(
            itemCount: rows.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final r = Map<String, dynamic>.from(rows[i] as Map);
              final conflicts = (r['conflictFlags'] as List?)?.length ?? 0;
              return ListTile(
                title: Text('${r['candidateName']} · ${r['roundName']}'),
                subtitle: Text('${r['jobTitle']} · ${r['startAt']}'),
                trailing: conflicts > 0
                    ? const Icon(Icons.warning, color: Colors.orange)
                    : Chip(label: Text(r['status'] as String)),
                onTap: () => showModalBottomSheet(
                  context: context,
                  builder: (_) => _InterviewActionsSheet(
                    interviewId: r['id'] as String, status: r['status'] as String,
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

class _InterviewActionsSheet extends ConsumerWidget {
  final String interviewId; final String status;
  const _InterviewActionsSheet({required this.interviewId, required this.status});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.read(interviewApiProvider);
    Future<void> run(Future<void> Function() f) async {
      try { await f(); } catch (_) {}
      ref.invalidate(upcomingInterviewsProvider);
      if (context.mounted) Navigator.pop(context);
    }
    return SafeArea(child: Column(mainAxisSize: MainAxisSize.min, children: [
      ListTile(leading: const Icon(Icons.check), title: const Text('Accept'),
        onTap: () => run(() async { await api.rsvp(interviewId, 'accepted'); })),
      ListTile(leading: const Icon(Icons.help_outline), title: const Text('Tentative'),
        onTap: () => run(() async { await api.rsvp(interviewId, 'tentative'); })),
      ListTile(leading: const Icon(Icons.close), title: const Text('Decline'),
        onTap: () => run(() async { await api.rsvp(interviewId, 'declined'); })),
      const Divider(),
      ListTile(leading: const Icon(Icons.play_arrow), title: const Text('Start'),
        enabled: status == 'confirmed' || status == 'scheduled',
        onTap: () => run(() async { await api.transition(interviewId, 'in_progress'); })),
      ListTile(leading: const Icon(Icons.flag), title: const Text('Mark completed'),
        enabled: status == 'in_progress',
        onTap: () => run(() async { await api.transition(interviewId, 'completed'); })),
      ListTile(leading: const Icon(Icons.cancel), title: const Text('Cancel'),
        onTap: () => run(() async { await api.transition(interviewId, 'cancelled', reason: 'Cancelled from mobile'); })),
    ]));
  }
}

class _ScorecardsTab extends ConsumerWidget {
  const _ScorecardsTab();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myScorecardsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(myScorecardsProvider),
      child: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ListView(children: [Padding(padding: const EdgeInsets.all(24), child: Text('Error: $e'))]),
        data: (rows) {
          if (rows.isEmpty) {
            return ListView(children: const [Padding(padding: EdgeInsets.all(48), child: Center(child: Text('No scorecards yet.')))]);
          }
          return ListView.separated(
            itemCount: rows.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final s = Map<String, dynamic>.from(rows[i] as Map);
              return ListTile(
                title: Text('Scorecard · ${s['interviewerName']}'),
                subtitle: Text('Status: ${s['status']} · due ${s['dueAt']}'),
                trailing: s['averageScore'] != null ? Chip(label: Text('${s['averageScore']}')) : null,
              );
            },
          );
        },
      ),
    );
  }
}
