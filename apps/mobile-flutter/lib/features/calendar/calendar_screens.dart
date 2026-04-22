// Domain 17 — Calendar screens: agenda list, event detail, compose.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'calendar_api.dart';

DateTime _startOfWeek(DateTime d) {
  final t = DateTime(d.year, d.month, d.day);
  return t.subtract(Duration(days: t.weekday - 1));
}

class CalendarAgendaScreen extends ConsumerStatefulWidget {
  const CalendarAgendaScreen({super.key});
  @override
  ConsumerState<CalendarAgendaScreen> createState() => _CalendarAgendaScreenState();
}

class _CalendarAgendaScreenState extends ConsumerState<CalendarAgendaScreen> {
  late DateTime _weekStart;
  @override
  void initState() {
    super.initState();
    _weekStart = _startOfWeek(DateTime.now());
  }

  @override
  Widget build(BuildContext context) {
    final from = _weekStart;
    final to = _weekStart.add(const Duration(days: 7));
    final asyncEvents = ref.watch(calendarEventsProvider((from: from, to: to)));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Calendar'),
        actions: [
          IconButton(icon: const Icon(Icons.chevron_left), onPressed: () => setState(() => _weekStart = _weekStart.subtract(const Duration(days: 7)))),
          IconButton(icon: const Icon(Icons.today), onPressed: () => setState(() => _weekStart = _startOfWeek(DateTime.now()))),
          IconButton(icon: const Icon(Icons.chevron_right), onPressed: () => setState(() => _weekStart = _weekStart.add(const Duration(days: 7)))),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add),
        label: const Text('New event'),
        onPressed: () => context.go('/calendar/new'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(calendarEventsProvider((from: from, to: to)).future),
        child: asyncEvents.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [
            const SizedBox(height: 80),
            Center(child: Column(children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 8),
              Text('Could not load events\n$e', textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => ref.refresh(calendarEventsProvider((from: from, to: to)).future),
                icon: const Icon(Icons.refresh), label: const Text('Retry'),
              ),
            ])),
          ]),
          data: (events) {
            if (events.isEmpty) {
              return ListView(children: const [SizedBox(height: 120), Center(child: Text('Nothing scheduled this week'))]);
            }
            // Group by day
            final byDay = <String, List<Map<String, dynamic>>>{};
            for (final e in events) {
              final starts = DateTime.tryParse((e['startsAt'] ?? '').toString())?.toLocal();
              if (starts == null) continue;
              final key = '${starts.year}-${starts.month.toString().padLeft(2, '0')}-${starts.day.toString().padLeft(2, '0')}';
              byDay.putIfAbsent(key, () => []).add(e);
            }
            final sortedKeys = byDay.keys.toList()..sort();
            return ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: sortedKeys.length,
              itemBuilder: (_, i) {
                final k = sortedKeys[i];
                final dayEvents = byDay[k]!;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                      child: Text(k, style: Theme.of(context).textTheme.titleMedium),
                    ),
                    ...dayEvents.map((e) {
                      final id = (e['id'] ?? '').toString();
                      final start = DateTime.tryParse((e['startsAt'] ?? '').toString())?.toLocal();
                      final end   = DateTime.tryParse((e['endsAt']   ?? '').toString())?.toLocal();
                      final time = start != null && end != null
                          ? '${start.hour.toString().padLeft(2, '0')}:${start.minute.toString().padLeft(2, '0')} – ${end.hour.toString().padLeft(2, '0')}:${end.minute.toString().padLeft(2, '0')}'
                          : '';
                      return Card(
                        child: ListTile(
                          leading: const Icon(Icons.event),
                          title: Text((e['title'] ?? 'Untitled').toString()),
                          subtitle: Text('$time${(e['location'] ?? '').toString().isNotEmpty ? '  ·  ${e['location']}' : ''}'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => context.go('/calendar/$id'),
                        ),
                      );
                    }),
                  ]),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class CalendarEventDetailScreen extends ConsumerWidget {
  final String eventId;
  const CalendarEventDetailScreen({super.key, required this.eventId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncE = ref.watch(calendarEventProvider(eventId));
    return Scaffold(
      appBar: AppBar(title: const Text('Event')),
      body: asyncE.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (e) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text((e['title'] ?? '').toString(), style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text('${e['startsAt']} → ${e['endsAt']}'),
            if ((e['location'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(children: [const Icon(Icons.place_outlined, size: 18), const SizedBox(width: 4), Text(e['location'].toString())]),
            ],
            if ((e['meetingUrl'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(children: [const Icon(Icons.videocam_outlined, size: 18), const SizedBox(width: 4), Expanded(child: Text(e['meetingUrl'].toString()))]),
            ],
            const SizedBox(height: 16),
            Text((e['description'] ?? '').toString()),
            const SizedBox(height: 24),
            Row(children: [
              OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(calendarApiProvider).deleteEvent(eventId);
                  if (context.mounted) context.pop();
                },
                icon: const Icon(Icons.delete_outline), label: const Text('Cancel'),
              ),
            ]),
          ]),
        ),
      ),
    );
  }
}

class CalendarComposeScreen extends ConsumerStatefulWidget {
  const CalendarComposeScreen({super.key});
  @override
  ConsumerState<CalendarComposeScreen> createState() => _CalendarComposeScreenState();
}

class _CalendarComposeScreenState extends ConsumerState<CalendarComposeScreen> {
  final _title = TextEditingController();
  final _desc  = TextEditingController();
  final _loc   = TextEditingController();
  DateTime _start = DateTime.now().add(const Duration(hours: 1));
  DateTime _end   = DateTime.now().add(const Duration(hours: 2));
  bool _saving = false;

  @override
  void dispose() { _title.dispose(); _desc.dispose(); _loc.dispose(); super.dispose(); }

  Future<void> _pick(BuildContext context, bool isStart) async {
    final base = isStart ? _start : _end;
    final date = await showDatePicker(context: context, firstDate: DateTime.now().subtract(const Duration(days: 365)), lastDate: DateTime.now().add(const Duration(days: 365)), initialDate: base);
    if (date == null || !context.mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(base));
    if (time == null) return;
    final dt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    setState(() {
      if (isStart) {
        _start = dt;
        if (!_end.isAfter(_start)) _end = _start.add(const Duration(hours: 1));
      } else {
        _end = dt;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New event')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 12),
          TextField(controller: _loc, decoration: const InputDecoration(labelText: 'Location (optional)')),
          const SizedBox(height: 12),
          TextField(controller: _desc, maxLines: 4, decoration: const InputDecoration(labelText: 'Description')),
          const SizedBox(height: 16),
          ListTile(title: const Text('Starts'), subtitle: Text(_start.toString()), trailing: const Icon(Icons.edit_calendar), onTap: () => _pick(context, true)),
          ListTile(title: const Text('Ends'),   subtitle: Text(_end.toString()),   trailing: const Icon(Icons.edit_calendar), onTap: () => _pick(context, false)),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _saving ? null : () async {
              if (_title.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title is required')));
                return;
              }
              setState(() => _saving = true);
              try {
                final created = await ref.read(calendarApiProvider).createEvent({
                  'title': _title.text.trim(),
                  'description': _desc.text.trim(),
                  'location': _loc.text.trim(),
                  'startsAt': _start.toUtc().toIso8601String(),
                  'endsAt':   _end.toUtc().toIso8601String(),
                }, idempotencyKey: 'evt-${DateTime.now().microsecondsSinceEpoch}');
                if (context.mounted) {
                  context.go('/calendar/${created['id']}');
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                }
              } finally {
                if (mounted) setState(() => _saving = false);
              }
            },
            icon: const Icon(Icons.check), label: Text(_saving ? 'Saving…' : 'Create'),
          ),
        ]),
      ),
    );
  }
}
