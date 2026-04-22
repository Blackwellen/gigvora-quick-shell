import 'package:flutter/material.dart';

class ContractsListScreen extends StatelessWidget {
  const ContractsListScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Contracts & SOWs')),
    body: ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        ListTile(title: Text('Acme x Contoso — MSA'), subtitle: Text('Executed'), trailing: Icon(Icons.chevron_right)),
        ListTile(title: Text('Q4 Brand refresh SOW'), subtitle: Text('Sent — awaiting client signature'), trailing: Icon(Icons.chevron_right)),
      ],
    ),
  );
}

class SowDetailScreen extends StatelessWidget {
  final String sowId;
  const SowDetailScreen({super.key, required this.sowId});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text('SOW $sowId')),
    body: ListView(padding: const EdgeInsets.all(16), children: const [
      Card(child: ListTile(title: Text('Version 1'), subtitle: Text('Current'))),
      SizedBox(height: 12),
      Text('Signatures', style: TextStyle(fontWeight: FontWeight.w600)),
      ListTile(title: Text('Client (pending)')),
      ListTile(title: Text('Vendor — signed')),
    ]),
    bottomNavigationBar: Padding(
      padding: const EdgeInsets.all(12),
      child: FilledButton.icon(onPressed: () {}, icon: const Icon(Icons.draw), label: const Text('Sign')),
    ),
  );
}
