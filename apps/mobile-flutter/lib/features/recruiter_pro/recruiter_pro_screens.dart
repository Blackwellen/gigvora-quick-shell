import 'package:flutter/material.dart';

class RecruiterPipelinesScreen extends StatelessWidget {
  const RecruiterPipelinesScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Recruiter pipelines')),
    body: ListView(padding: const EdgeInsets.all(16), children: const [
      Card(child: ListTile(title: Text('Senior Frontend Engineer'), subtitle: Text('3 stages · 12 candidates'))),
    ]),
    floatingActionButton: FloatingActionButton.extended(onPressed: () {}, icon: const Icon(Icons.add), label: const Text('New pipeline')),
  );
}

class RecruiterPipelineDetailScreen extends StatelessWidget {
  final String pipelineId;
  const RecruiterPipelineDetailScreen({super.key, required this.pipelineId});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Pipeline')),
    body: const Padding(
      padding: EdgeInsets.all(16),
      child: Row(children: [
        Expanded(child: _StageColumn(title: 'Sourced', count: 5)),
        SizedBox(width: 12),
        Expanded(child: _StageColumn(title: 'Phone', count: 4)),
        SizedBox(width: 12),
        Expanded(child: _StageColumn(title: 'Technical', count: 3)),
      ]),
    ),
  );
}

class _StageColumn extends StatelessWidget {
  final String title;
  final int count;
  const _StageColumn({required this.title, required this.count});
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('$title ($count)', style: Theme.of(context).textTheme.titleSmall),
        const Divider(),
        for (var i = 0; i < count; i++)
          ListTile(dense: true, title: Text('Candidate ${i + 1}'), subtitle: const Text('★★★★☆')),
      ]),
    ),
  );
}
