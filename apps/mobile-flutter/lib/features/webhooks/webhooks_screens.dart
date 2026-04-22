import 'package:flutter/material.dart';

class WebhooksListScreen extends StatelessWidget {
  const WebhooksListScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Webhooks')),
    body: ListView(padding: const EdgeInsets.all(16), children: const [
      Card(child: ListTile(
        leading: Icon(Icons.bolt),
        title: Text('https://example.com/hooks/gigvora'),
        subtitle: Text('Active · 3 event types'),
        trailing: Icon(Icons.chevron_right),
      )),
    ]),
    floatingActionButton: FloatingActionButton.extended(onPressed: () {}, icon: const Icon(Icons.add), label: const Text('New endpoint')),
  );
}

class WebhookDeliveriesScreen extends StatelessWidget {
  final String endpointId;
  const WebhookDeliveriesScreen({super.key, required this.endpointId});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Deliveries')),
    body: ListView(children: const [
      ListTile(leading: Icon(Icons.check_circle, color: Colors.green), title: Text('feed.post.created'), subtitle: Text('200 OK · 184ms'), trailing: Text('now')),
      ListTile(leading: Icon(Icons.error, color: Colors.red), title: Text('inbox.message.created'), subtitle: Text('500 · attempt 2/8'), trailing: Text('1m')),
    ]),
  );
}
