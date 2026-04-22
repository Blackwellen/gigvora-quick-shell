import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'events_providers.dart';

/// Domain 15 — Mobile parity screens. Discovery, detail (about/sessions/
/// chat), RSVP via sticky bottom bar, QR check-in entry, lightweight
/// lobby chat. Host controls remain web-only and deep-link to web.

class EventsListScreen extends ConsumerStatefulWidget {
  const EventsListScreen({super.key});
  @override
  ConsumerState<EventsListScreen> createState() => _EventsListScreenState();
}

class _EventsListScreenState extends ConsumerState<EventsListScreen> {
  String? q;
  @override
  Widget build(BuildContext context) {
    final list = ref.watch(eventsListProvider(q));
    return Scaffold(
      appBar: AppBar(title: const Text('Events')),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            decoration: const InputDecoration(hintText: 'Search events…', prefixIcon: Icon(Icons.search)),
            onSubmitted: (v) => setState(() => q = v.isEmpty ? null : v),
          ),
        ),
        Expanded(child: list.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _ErrorRetry(message: e.toString(), onRetry: () => ref.invalidate(eventsListProvider(q))),
          data: (items) => items.isEmpty
            ? const Center(child: Text('No events found'))
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(eventsListProvider(q)),
                child: ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 0),
                  itemBuilder: (ctx, i) {
                    final e = items[i];
                    return ListTile(
                      leading: CircleAvatar(child: Text((e['type']?.toString() ?? 'E')[0].toUpperCase())),
                      title: Text(e['title']?.toString() ?? 'Event'),
                      subtitle: Text('${e['format'] ?? 'virtual'} · ${e['startsAt'] ?? ''}'),
                      trailing: Text('${e['rsvpCount'] ?? 0} RSVPs', style: const TextStyle(fontSize: 12)),
                      onTap: () => context.go('/events/${e['slug'] ?? e['id']}'),
                    );
                  },
                ),
              ),
        )),
      ]),
    );
  }
}

class EventDetailScreen extends ConsumerWidget {
  final String idOrSlug;
  const EventDetailScreen({super.key, required this.idOrSlug});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(eventDetailProvider(idOrSlug));
    return Scaffold(
      appBar: AppBar(title: const Text('Event')),
      bottomSheet: detail.maybeWhen(
        data: (e) => _RsvpBar(eventId: e['id']?.toString() ?? idOrSlug, status: e['status']?.toString() ?? 'scheduled', myRsvp: e['myRsvp']?.toString()),
        orElse: () => null,
      ),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => _ErrorRetry(message: err.toString(), onRetry: () => ref.invalidate(eventDetailProvider(idOrSlug))),
        data: (e) {
          final id = e['id']?.toString() ?? idOrSlug;
          return DefaultTabController(
            length: 3,
            child: Column(children: [
              ListTile(
                title: Text(e['title']?.toString() ?? 'Event'),
                subtitle: Text('${e['format'] ?? 'virtual'} · ${e['timezone'] ?? 'UTC'} · ${e['startsAt'] ?? ''}'),
              ),
              const TabBar(tabs: [Tab(text: 'About'), Tab(text: 'Sessions'), Tab(text: 'Lobby')]),
              Expanded(child: TabBarView(children: [
                _AboutTab(event: e),
                _SessionsTab(eventId: id),
                _LobbyTab(eventId: id),
              ])),
              const SizedBox(height: 64), // room for sticky RSVP bar
            ]),
          );
        },
      ),
    );
  }
}

class _AboutTab extends StatelessWidget {
  final Map<String, dynamic> event;
  const _AboutTab({required this.event});
  @override
  Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(16), children: [
    Text(event['description']?.toString() ?? 'No description.'),
    const SizedBox(height: 12),
    Text('Capacity: ${event['capacity'] ?? '—'}'),
    Text('RSVPs: ${event['rsvpCount'] ?? 0}'),
    Text('Status: ${event['status'] ?? 'scheduled'}'),
    const SizedBox(height: 12),
    if (event['location'] != null) Row(children: [const Icon(Icons.place, size: 16), const SizedBox(width: 6), Expanded(child: Text(event['location'].toString()))]),
    if (event['meetingUrl'] != null) Padding(padding: const EdgeInsets.only(top: 8), child: Row(children: [const Icon(Icons.videocam, size: 16), const SizedBox(width: 6), Expanded(child: Text(event['meetingUrl'].toString(), maxLines: 1, overflow: TextOverflow.ellipsis))])),
  ]);
}

class _SessionsTab extends ConsumerWidget {
  final String eventId;
  const _SessionsTab({required this.eventId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(eventSessionsProvider(eventId));
    return s.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(message: e.toString(), onRetry: () => ref.invalidate(eventSessionsProvider(eventId))),
      data: (items) => items.isEmpty
        ? const Center(child: Text('No sessions yet'))
        : ListView.separated(
            itemCount: items.length, separatorBuilder: (_, __) => const Divider(height: 0),
            itemBuilder: (ctx, i) {
              final ss = items[i];
              return ListTile(
                title: Text(ss['title']?.toString() ?? '—'),
                subtitle: Text('${ss['startsAt'] ?? ''} · ${ss['durationMin'] ?? 0} min'),
              );
            },
          ),
    );
  }
}

class _LobbyTab extends ConsumerStatefulWidget {
  final String eventId;
  const _LobbyTab({required this.eventId});
  @override
  ConsumerState<_LobbyTab> createState() => _LobbyTabState();
}

class _LobbyTabState extends ConsumerState<_LobbyTab> {
  final ctrl = TextEditingController();
  @override
  Widget build(BuildContext context) {
    final msgs = ref.watch(eventMessagesProvider(widget.eventId));
    return Column(children: [
      Expanded(child: msgs.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorRetry(message: e.toString(), onRetry: () => ref.invalidate(eventMessagesProvider(widget.eventId))),
        data: (items) => items.isEmpty
          ? const Center(child: Text('Lobby is quiet — start the conversation'))
          : ListView.builder(
              reverse: true, itemCount: items.length,
              itemBuilder: (ctx, i) {
                final m = items[i];
                return ListTile(dense: true, title: Text(m['body']?.toString() ?? ''), subtitle: Text(m['authorId']?.toString() ?? '—'));
              },
            ),
      )),
      Padding(
        padding: EdgeInsets.fromLTRB(8, 4, 8, 8 + MediaQuery.of(context).viewInsets.bottom),
        child: Row(children: [
          Expanded(child: TextField(controller: ctrl, decoration: const InputDecoration(hintText: 'Say hello…', border: OutlineInputBorder()))),
          IconButton(icon: const Icon(Icons.send), onPressed: () async {
            if (ctrl.text.isEmpty) return;
            try {
              await ref.read(eventsApiProvider).postMessage(widget.eventId, ctrl.text, channel: 'lobby');
              ctrl.clear();
              ref.invalidate(eventMessagesProvider(widget.eventId));
            } catch (e) {
              if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Send failed: $e')));
            }
          }),
        ]),
      ),
    ]);
  }
}

class _RsvpBar extends ConsumerStatefulWidget {
  final String eventId; final String status; final String? myRsvp;
  const _RsvpBar({required this.eventId, required this.status, this.myRsvp});
  @override
  ConsumerState<_RsvpBar> createState() => _RsvpBarState();
}

class _RsvpBarState extends ConsumerState<_RsvpBar> {
  bool busy = false;
  @override
  Widget build(BuildContext context) {
    final going = widget.myRsvp == 'going' || widget.myRsvp == 'attended';
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface, border: Border(top: BorderSide(color: Theme.of(context).dividerColor))),
        child: Row(children: [
          Expanded(child: Text(going ? 'You\'re going' : 'Reserve your spot', style: Theme.of(context).textTheme.bodyMedium)),
          OutlinedButton.icon(
            icon: const Icon(Icons.qr_code_scanner, size: 18),
            label: const Text('Check in'),
            onPressed: busy ? null : () async {
              setState(() => busy = true);
              try {
                await ref.read(eventsApiProvider).checkIn(widget.eventId, 'self', method: 'qr');
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Checked in')));
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Check-in failed: $e')));
              } finally { if (mounted) setState(() => busy = false); }
            },
          ),
          const SizedBox(width: 8),
          FilledButton(
            onPressed: busy ? null : () async {
              setState(() => busy = true);
              try {
                if (going) {
                  await ref.read(eventsApiProvider).cancelRsvp(widget.eventId);
                } else {
                  await ref.read(eventsApiProvider).rsvp(widget.eventId, status: 'going');
                }
                ref.invalidate(eventDetailProvider(widget.eventId));
              } catch (e) {
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('RSVP failed: $e')));
              } finally { if (mounted) setState(() => busy = false); }
            },
            child: Text(going ? 'Cancel' : 'RSVP'),
          ),
        ]),
      ),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  final String message; final VoidCallback onRetry;
  const _ErrorRetry({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, size: 32),
      const SizedBox(height: 8), Text(message, textAlign: TextAlign.center),
      const SizedBox(height: 12), FilledButton(onPressed: onRetry, child: const Text('Retry')),
    ]),
  );
}
