import 'package:flutter/material.dart';

class IntegrationsListScreen extends StatelessWidget {
  const IntegrationsListScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Integrations')),
    body: ListView(padding: const EdgeInsets.all(16), children: const [
      _ProviderTile(slug: 'stripe', name: 'Stripe', category: 'Payments'),
      _ProviderTile(slug: 'github', name: 'GitHub', category: 'Storage'),
      _ProviderTile(slug: 'google', name: 'Google', category: 'Comms'),
      _ProviderTile(slug: 'slack', name: 'Slack', category: 'Comms'),
      _ProviderTile(slug: 'openai', name: 'OpenAI', category: 'AI'),
      _ProviderTile(slug: 'anthropic', name: 'Anthropic', category: 'AI'),
      _ProviderTile(slug: 'hubspot', name: 'HubSpot', category: 'CRM'),
      _ProviderTile(slug: 'salesforce', name: 'Salesforce', category: 'CRM'),
    ]),
  );
}

class _ProviderTile extends StatelessWidget {
  final String slug; final String name; final String category;
  const _ProviderTile({required this.slug, required this.name, required this.category});
  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      leading: const Icon(Icons.extension),
      title: Text(name),
      subtitle: Text(category),
      trailing: FilledButton.tonal(onPressed: () {}, child: const Text('Connect')),
    ),
  );
}

class IntegrationConnectionDetailScreen extends StatelessWidget {
  final String connectionId;
  const IntegrationConnectionDetailScreen({super.key, required this.connectionId});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Connection')),
    body: ListView(padding: const EdgeInsets.all(16), children: const [
      ListTile(title: Text('Status'), trailing: Chip(label: Text('Connected'))),
      ListTile(title: Text('Last used'), subtitle: Text('—')),
      Divider(),
      Text('Recent events', style: TextStyle(fontWeight: FontWeight.w600)),
      ListTile(dense: true, title: Text('connected'), subtitle: Text('a moment ago')),
    ]),
    bottomNavigationBar: Padding(
      padding: const EdgeInsets.all(12),
      child: OutlinedButton.icon(onPressed: () {}, icon: const Icon(Icons.link_off), label: const Text('Disconnect')),
    ),
  );
}
