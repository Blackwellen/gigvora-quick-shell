import 'package:flutter/material.dart';

class PlansScreen extends StatelessWidget {
  const PlansScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Plans')),
    body: ListView(padding: const EdgeInsets.all(16), children: const [
      _PlanCard(name: 'Free',       price: '\$0/mo',  features: ['50 posts/mo']),
      _PlanCard(name: 'Pro',        price: '\$19/mo', features: ['500 posts/mo', 'Boolean search']),
      _PlanCard(name: 'Team',       price: '\$49/mo', features: ['10 seats', 'Shared inbox']),
      _PlanCard(name: 'Enterprise', price: 'Contact', features: ['SSO', 'Audit export']),
    ]),
  );
}

class _PlanCard extends StatelessWidget {
  final String name; final String price; final List<String> features;
  const _PlanCard({required this.name, required this.price, required this.features});
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(name, style: Theme.of(context).textTheme.titleLarge),
          Text(price, style: Theme.of(context).textTheme.titleMedium),
        ]),
        const SizedBox(height: 8),
        for (final f in features) Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(children: [const Icon(Icons.check, size: 16), const SizedBox(width: 6), Text(f)]),
        ),
        const SizedBox(height: 12),
        FilledButton(onPressed: () {}, child: const Text('Choose plan')),
      ]),
    ),
  );
}

class EntitlementsScreen extends StatelessWidget {
  const EntitlementsScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Your entitlements')),
    body: ListView(padding: const EdgeInsets.all(16), children: const [
      ListTile(title: Text('feed.posts'), subtitle: Text('Limit: 500/mo'), trailing: Chip(label: Text('Plan'))),
      ListTile(title: Text('recruiter.boolean_search'), trailing: Chip(label: Text('Plan'))),
    ]),
  );
}
