// Domain 18 — Mobile call history with bottom-sheet pre-join + swipe actions.
import 'package:flutter/material.dart';
import 'calls_api.dart';

class CallsScreen extends StatefulWidget {
  const CallsScreen({super.key});
  @override
  State<CallsScreen> createState() => _CallsScreenState();
}

class _CallsScreenState extends State<CallsScreen> {
  late Future<List<CallRecord>> _future;
  final _api = CallsApi();

  @override
  void initState() { super.initState(); _future = _api.list(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Calls')),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.video_call),
        label: const Text('New call'),
        onPressed: () => showModalBottomSheet(
          context: context, showDragHandle: true,
          builder: (_) => const _PreJoinSheet(),
        ),
      ),
      body: FutureBuilder<List<CallRecord>>(
        future: _future,
        builder: (ctx, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snap.data ?? [];
          if (items.isEmpty) {
            return const Center(child: Padding(padding: EdgeInsets.all(24),
              child: Text('No call history yet.', textAlign: TextAlign.center)));
          }
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final c = items[i];
              return Dismissible(
                key: ValueKey(c.id),
                background: Container(color: Colors.green, alignment: Alignment.centerLeft,
                  padding: const EdgeInsets.only(left: 16), child: const Icon(Icons.call, color: Colors.white)),
                secondaryBackground: Container(color: Colors.red, alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 16), child: const Icon(Icons.delete, color: Colors.white)),
                child: ListTile(
                  leading: CircleAvatar(child: Icon(c.kind == 'video' ? Icons.videocam : Icons.call)),
                  title: Text(c.contextLabel ?? c.id),
                  subtitle: Text('${c.status} · ${c.kind}'),
                  trailing: Text(c.durationSeconds != null ? '${(c.durationSeconds! ~/ 60)}m' : '—'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _PreJoinSheet extends StatelessWidget {
  const _PreJoinSheet();
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Pre-join checks', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: const [
          Icon(Icons.mic, size: 32), Icon(Icons.videocam, size: 32), Icon(Icons.wifi, size: 32),
        ]),
        const SizedBox(height: 24),
        FilledButton.icon(onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.call), label: const Text('Join now')),
      ]),
    );
  }
}
