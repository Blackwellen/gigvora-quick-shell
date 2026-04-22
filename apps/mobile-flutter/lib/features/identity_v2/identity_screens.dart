import 'package:flutter/material.dart';

class IdentitySwitcherScreen extends StatelessWidget {
  const IdentitySwitcherScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Switch identity')),
    body: ListView(children: const [
      ListTile(leading: CircleAvatar(child: Text('A')), title: Text('Alice Founder'), subtitle: Text('alice@example.dev'), trailing: Icon(Icons.check)),
      ListTile(leading: CircleAvatar(child: Text('B')), title: Text('Bob Recruiter'), subtitle: Text('bob@example.dev')),
      Divider(),
      ListTile(leading: Icon(Icons.add), title: Text('Add another account')),
    ]),
  );
}

class IdentityProfileScreen extends StatelessWidget {
  final String identityId;
  const IdentityProfileScreen({super.key, required this.identityId});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Identity')),
    body: ListView(padding: const EdgeInsets.all(16), children: [
      Text('ID: $identityId', style: Theme.of(context).textTheme.bodySmall),
      const SizedBox(height: 12),
      const ListTile(title: Text('Email'), subtitle: Text('alice@example.dev'), trailing: Icon(Icons.verified, color: Colors.green)),
      const ListTile(title: Text('Handle'), subtitle: Text('@alice')),
      const ListTile(title: Text('Status'), subtitle: Text('Active')),
    ]),
  );
}
