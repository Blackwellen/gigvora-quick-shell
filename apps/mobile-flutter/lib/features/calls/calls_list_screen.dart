// Domain 18 — Calls list + detail + compose (schedule call).
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../core/api_client.dart';

final _dioP = Provider<Dio>((ref) => ref.watch(apiClientProvider));

final callsListProvider = FutureProvider.autoDispose.family<List<Map<String, dynamic>>, String>((ref, status) async {
  final r = await ref.watch(_dioP).get('/api/v1/calls', queryParameters: {
    if (status.isNotEmpty) 'status': status, 'limit': 50,
  });
  final data = r.data;
  final list = data is List ? data : ((data as Map)['items'] as List? ?? const []);
  return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
});

final callDetailProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) async {
  final r = await ref.watch(_dioP).get('/api/v1/calls/$id');
  return Map<String, dynamic>.from(r.data as Map);
});

class CallsListScreen extends ConsumerStatefulWidget {
  const CallsListScreen({super.key});
  @override
  ConsumerState<CallsListScreen> createState() => _CallsListScreenState();
}

class _CallsListScreenState extends ConsumerState<CallsListScreen> {
  String _status = '';
  @override
  Widget build(BuildContext context) {
    final asyncList = ref.watch(callsListProvider(_status));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Calls'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(children: [
              for (final s in const ['', 'scheduled', 'in_progress', 'completed', 'cancelled'])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(s.isEmpty ? 'All' : s.replaceAll('_', ' ')),
                    selected: _status == s,
                    onSelected: (_) => setState(() => _status = s),
                  ),
                ),
            ]),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add_call), label: const Text('Schedule'),
        onPressed: () => context.go('/calls/new'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(callsListProvider(_status).future),
        child: asyncList.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [const SizedBox(height: 80), Center(child: Text('$e'))]),
          data: (items) => items.isEmpty
              ? ListView(children: const [SizedBox(height: 120), Center(child: Text('No calls scheduled'))])
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final c = items[i];
                    final id = (c['id'] ?? '').toString();
                    return Card(
                      child: ListTile(
                        leading: const Icon(Icons.videocam_outlined),
                        title: Text((c['title'] ?? c['subject'] ?? 'Call').toString()),
                        subtitle: Text('${c['startsAt'] ?? ''}  ·  ${c['status'] ?? ''}'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.go('/calls/$id'),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class CallDetailScreen extends ConsumerWidget {
  final String callId;
  const CallDetailScreen({super.key, required this.callId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncC = ref.watch(callDetailProvider(callId));
    return Scaffold(
      appBar: AppBar(title: const Text('Call')),
      body: asyncC.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (c) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text((c['title'] ?? c['subject'] ?? 'Call').toString(), style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Wrap(spacing: 8, children: [
              Chip(label: Text((c['status'] ?? '').toString())),
              if (c['durationMinutes'] != null) Chip(label: Text('${c['durationMinutes']} min')),
            ]),
            const SizedBox(height: 16),
            Text('Starts: ${c['startsAt'] ?? ''}'),
            if ((c['joinUrl'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 16),
              FilledButton.icon(onPressed: () {}, icon: const Icon(Icons.videocam), label: const Text('Join call')),
            ],
            const SizedBox(height: 16),
            if ((c['notes'] ?? '').toString().isNotEmpty) Text(c['notes'].toString()),
            const SizedBox(height: 24),
            Row(children: [
              OutlinedButton.icon(
                onPressed: () async {
                  try {
                    await ref.read(_dioP).post('/api/v1/calls/$callId/cancel');
                    ref.refresh(callDetailProvider(callId));
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
                    }
                  }
                },
                icon: const Icon(Icons.cancel_outlined), label: const Text('Cancel'),
              ),
            ]),
          ]),
        ),
      ),
    );
  }
}

class CallComposeScreen extends ConsumerStatefulWidget {
  const CallComposeScreen({super.key});
  @override
  ConsumerState<CallComposeScreen> createState() => _CallComposeScreenState();
}

class _CallComposeScreenState extends ConsumerState<CallComposeScreen> {
  final _title = TextEditingController();
  final _participants = TextEditingController();
  DateTime _start = DateTime.now().add(const Duration(hours: 1));
  int _duration = 30;
  bool _saving = false;
  @override
  void dispose() { _title.dispose(); _participants.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Schedule call')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 12),
          TextField(controller: _participants, decoration: const InputDecoration(labelText: 'Participants (comma-separated identity IDs)')),
          const SizedBox(height: 12),
          ListTile(
            title: const Text('Starts'),
            subtitle: Text(_start.toString()),
            trailing: const Icon(Icons.edit_calendar),
            onTap: () async {
              final d = await showDatePicker(context: context, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 180)), initialDate: _start);
              if (d == null || !context.mounted) return;
              final t = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_start));
              if (t == null) return;
              setState(() => _start = DateTime(d.year, d.month, d.day, t.hour, t.minute));
            },
          ),
          DropdownButtonFormField<int>(
            initialValue: _duration,
            decoration: const InputDecoration(labelText: 'Duration'),
            items: const [15, 30, 45, 60, 90].map((m) => DropdownMenuItem(value: m, child: Text('$m minutes'))).toList(),
            onChanged: (v) => setState(() => _duration = v ?? 30),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _saving ? null : () async {
              if (_title.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title is required')));
                return;
              }
              setState(() => _saving = true);
              try {
                final parts = _participants.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
                final r = await ref.read(_dioP).post('/api/v1/calls', data: {
                  'title': _title.text.trim(),
                  'startsAt': _start.toUtc().toIso8601String(),
                  'durationMinutes': _duration,
                  'participants': parts,
                }, options: Options(headers: {'Idempotency-Key': 'call-${DateTime.now().microsecondsSinceEpoch}'}));
                final id = (r.data as Map)['id']?.toString();
                if (context.mounted && id != null) context.go('/calls/$id');
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                }
              } finally {
                if (mounted) setState(() => _saving = false);
              }
            },
            icon: const Icon(Icons.check), label: Text(_saving ? 'Scheduling…' : 'Schedule'),
          ),
        ]),
      ),
    );
  }
}
