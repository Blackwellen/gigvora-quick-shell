import 'package:flutter/material.dart';

class InboxThreadsScreen extends StatelessWidget {
  const InboxThreadsScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Inbox')),
    body: ListView(children: const [
      ListTile(leading: CircleAvatar(child: Text('A')), title: Text('Alice'), subtitle: Text('Welcome to Gigvora!'), trailing: Text('now')),
    ]),
    floatingActionButton: FloatingActionButton(onPressed: () {}, child: const Icon(Icons.edit)),
  );
}

class InboxThreadDetailScreen extends StatefulWidget {
  final String threadId;
  const InboxThreadDetailScreen({super.key, required this.threadId});
  @override
  State<InboxThreadDetailScreen> createState() => _InboxThreadDetailScreenState();
}

class _InboxThreadDetailScreenState extends State<InboxThreadDetailScreen> {
  final _ctl = TextEditingController();
  final _msgs = <String>['Hey there', 'How are things?'];

  void _send() {
    final t = _ctl.text.trim();
    if (t.isEmpty) return;
    setState(() { _msgs.add(t); _ctl.clear(); });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Conversation')),
    body: Column(children: [
      Expanded(
        child: ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: _msgs.length,
          itemBuilder: (_, i) => Align(
            alignment: i.isEven ? Alignment.centerLeft : Alignment.centerRight,
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: i.isEven ? Colors.grey.shade200 : Colors.blue.shade100,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(_msgs[i]),
            ),
          ),
        ),
      ),
      SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Row(children: [
            Expanded(child: TextField(controller: _ctl, decoration: const InputDecoration(hintText: 'Message…', border: OutlineInputBorder()), onSubmitted: (_) => _send())),
            const SizedBox(width: 8),
            IconButton.filled(onPressed: _send, icon: const Icon(Icons.send)),
          ]),
        ),
      ),
    ]),
  );
}
