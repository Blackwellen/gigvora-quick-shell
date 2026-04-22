// Domain 16 — Booking list + detail + compose. Wraps booking_api.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../core/api_client.dart';

final bookingDioProvider = Provider<Dio>((ref) => ref.watch(apiClientProvider));

final bookingListProvider = FutureProvider.autoDispose
    .family<List<Map<String, dynamic>>, String>((ref, status) async {
  final r = await ref.watch(bookingDioProvider).get('/api/v1/bookings', queryParameters: {
    if (status.isNotEmpty) 'status': status,
    'limit': 50,
  });
  final data = r.data;
  final list = data is List ? data : ((data as Map)['items'] as List? ?? const []);
  return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
});

final bookingDetailProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) async {
  final r = await ref.watch(bookingDioProvider).get('/api/v1/bookings/$id');
  return Map<String, dynamic>.from(r.data as Map);
});

class BookingListScreen extends ConsumerStatefulWidget {
  const BookingListScreen({super.key});
  @override
  ConsumerState<BookingListScreen> createState() => _BookingListScreenState();
}

class _BookingListScreenState extends ConsumerState<BookingListScreen> {
  String _status = '';
  @override
  Widget build(BuildContext context) {
    final asyncList = ref.watch(bookingListProvider(_status));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookings'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(children: [
              for (final s in const ['', 'pending', 'confirmed', 'completed', 'cancelled'])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(s.isEmpty ? 'All' : s[0].toUpperCase() + s.substring(1)),
                    selected: _status == s,
                    onSelected: (_) => setState(() => _status = s),
                  ),
                ),
            ]),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add), label: const Text('New booking'),
        onPressed: () => context.go('/bookings/new'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(bookingListProvider(_status).future),
        child: asyncList.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [const SizedBox(height: 80), Center(child: Text('$e'))]),
          data: (items) => items.isEmpty
              ? ListView(children: const [SizedBox(height: 120), Center(child: Text('No bookings'))])
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (_, i) {
                    final b = items[i];
                    final id = (b['id'] ?? '').toString();
                    return Card(
                      child: ListTile(
                        leading: const Icon(Icons.event_available),
                        title: Text((b['title'] ?? b['serviceName'] ?? 'Booking').toString()),
                        subtitle: Text('${b['startsAt'] ?? ''}  ·  ${b['status'] ?? ''}'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => context.go('/bookings/$id'),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncB = ref.watch(bookingDetailProvider(bookingId));
    return Scaffold(
      appBar: AppBar(title: const Text('Booking')),
      body: asyncB.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('$e')),
        data: (b) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text((b['title'] ?? b['serviceName'] ?? 'Booking').toString(), style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Wrap(spacing: 8, children: [
              Chip(label: Text((b['status'] ?? '').toString())),
              if (b['priceCents'] != null) Chip(label: Text('£${(b['priceCents'] / 100).toStringAsFixed(2)}')),
            ]),
            const SizedBox(height: 16),
            Text('Starts: ${b['startsAt'] ?? ''}'),
            Text('Ends: ${b['endsAt'] ?? ''}'),
            if ((b['notes'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text('Notes', style: TextStyle(fontWeight: FontWeight.bold)),
              Text(b['notes'].toString()),
            ],
            const SizedBox(height: 24),
            Row(children: [
              OutlinedButton.icon(
                onPressed: () async {
                  try {
                    await ref.read(bookingDioProvider).post('/api/v1/bookings/$bookingId/cancel');
                    ref.refresh(bookingDetailProvider(bookingId));
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
                    }
                  }
                },
                icon: const Icon(Icons.cancel_outlined), label: const Text('Cancel booking'),
              ),
            ]),
          ]),
        ),
      ),
    );
  }
}

class BookingComposeScreen extends ConsumerStatefulWidget {
  const BookingComposeScreen({super.key});
  @override
  ConsumerState<BookingComposeScreen> createState() => _BookingComposeScreenState();
}

class _BookingComposeScreenState extends ConsumerState<BookingComposeScreen> {
  final _service = TextEditingController();
  final _notes   = TextEditingController();
  DateTime _start = DateTime.now().add(const Duration(days: 1));
  bool _saving = false;

  @override
  void dispose() { _service.dispose(); _notes.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New booking')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          TextField(controller: _service, decoration: const InputDecoration(labelText: 'Service ID or name')),
          const SizedBox(height: 12),
          ListTile(
            title: const Text('Starts'),
            subtitle: Text(_start.toString()),
            trailing: const Icon(Icons.edit_calendar),
            onTap: () async {
              final date = await showDatePicker(context: context, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)), initialDate: _start);
              if (date == null || !context.mounted) return;
              final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_start));
              if (time == null) return;
              setState(() => _start = DateTime(date.year, date.month, date.day, time.hour, time.minute));
            },
          ),
          TextField(controller: _notes, maxLines: 4, decoration: const InputDecoration(labelText: 'Notes')),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _saving ? null : () async {
              if (_service.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Service is required')));
                return;
              }
              setState(() => _saving = true);
              try {
                final r = await ref.read(bookingDioProvider).post('/api/v1/bookings', data: {
                  'serviceId': _service.text.trim(),
                  'startsAt': _start.toUtc().toIso8601String(),
                  'notes': _notes.text.trim(),
                }, options: Options(headers: {'Idempotency-Key': 'bk-${DateTime.now().microsecondsSinceEpoch}'}));
                final id = (r.data as Map)['id']?.toString();
                if (context.mounted && id != null) context.go('/bookings/$id');
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
                }
              } finally {
                if (mounted) setState(() => _saving = false);
              }
            },
            icon: const Icon(Icons.check), label: Text(_saving ? 'Booking…' : 'Book'),
          ),
        ]),
      ),
    );
  }
}
