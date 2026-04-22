// Domain 19 — Mobile booking screen with appointment list + bottom-sheet booking.
import 'package:flutter/material.dart';
import 'booking_api.dart';

class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key});
  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  late Future<List<Appointment>> _future;
  final _api = BookingApi();

  @override
  void initState() { super.initState(); _future = _api.appointments(); }

  Color _color(String s) {
    switch (s) {
      case 'confirmed': return Colors.green;
      case 'pending': return Colors.amber;
      case 'cancelled': case 'no_show': return Colors.red;
      case 'completed': return Colors.blueGrey;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bookings')),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.calendar_month),
        label: const Text('New booking'),
        onPressed: () => showModalBottomSheet(
          context: context, showDragHandle: true, isScrollControlled: true,
          builder: (_) => const _NewBookingSheet(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async { setState(() { _future = _api.appointments(); }); },
        child: FutureBuilder<List<Appointment>>(
          future: _future,
          builder: (ctx, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            final items = snap.data ?? [];
            if (items.isEmpty) {
              return ListView(children: const [
                SizedBox(height: 80),
                Center(child: Padding(padding: EdgeInsets.all(24),
                  child: Text('No appointments yet.', textAlign: TextAlign.center))),
              ]);
            }
            return ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, i) {
                final a = items[i];
                return ListTile(
                  leading: CircleAvatar(backgroundColor: _color(a.status), child: const Icon(Icons.event, color: Colors.white)),
                  title: Text(a.inviteeName),
                  subtitle: Text('${a.startAt}\n${a.status}'),
                  isThreeLine: true,
                  trailing: a.joinUrl != null ? const Icon(Icons.video_call) : null,
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _NewBookingSheet extends StatelessWidget {
  const _NewBookingSheet();
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24, right: 24, top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Book a slot', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        const TextField(decoration: InputDecoration(labelText: 'Your name')),
        const SizedBox(height: 8),
        const TextField(decoration: InputDecoration(labelText: 'Email')),
        const SizedBox(height: 16),
        FilledButton.icon(onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.check), label: const Text('Confirm booking')),
      ]),
    );
  }
}
