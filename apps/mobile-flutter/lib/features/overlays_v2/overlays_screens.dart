import 'package:flutter/material.dart';

class WizardLauncherScreen extends StatelessWidget {
  const WizardLauncherScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Create something')),
    body: GridView.count(
      padding: const EdgeInsets.all(16),
      crossAxisCount: 2,
      childAspectRatio: 1.4,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      children: const [
        _WizardTile(icon: Icons.work,         label: 'Project', slug: 'create.project'),
        _WizardTile(icon: Icons.shopping_bag, label: 'Gig',     slug: 'create.gig'),
        _WizardTile(icon: Icons.badge,        label: 'Job',     slug: 'create.job'),
        _WizardTile(icon: Icons.handshake,    label: 'Service', slug: 'create.service'),
      ],
    ),
  );
}

class _WizardTile extends StatelessWidget {
  final IconData icon; final String label; final String slug;
  const _WizardTile({required this.icon, required this.label, required this.slug});
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      onTap: () {},
      child: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 40),
          const SizedBox(height: 8),
          Text(label, style: Theme.of(context).textTheme.titleMedium),
        ]),
      ),
    ),
  );
}

class DraftsScreen extends StatelessWidget {
  const DraftsScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Drafts')),
    body: ListView(children: const [
      ListTile(leading: Icon(Icons.edit_note), title: Text('Untitled project'), subtitle: Text('Step 2 of 5 · 5m ago'), trailing: Icon(Icons.chevron_right)),
      ListTile(leading: Icon(Icons.edit_note), title: Text('Untitled gig'),     subtitle: Text('Step 1 of 4 · 2h ago'), trailing: Icon(Icons.chevron_right)),
    ]),
  );
}
