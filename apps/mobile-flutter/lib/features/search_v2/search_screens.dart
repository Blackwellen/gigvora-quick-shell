import 'package:flutter/material.dart';

class GlobalSearchScreen extends StatefulWidget {
  const GlobalSearchScreen({super.key});
  @override
  State<GlobalSearchScreen> createState() => _GlobalSearchScreenState();
}

class _GlobalSearchScreenState extends State<GlobalSearchScreen> {
  final _ctl = TextEditingController();
  String _scope = 'all';
  final _scopes = const ['all', 'people', 'companies', 'gigs', 'services', 'jobs', 'posts'];
  List<Map<String, String>> _results = const [];

  void _run() {
    final q = _ctl.text.trim();
    if (q.isEmpty) { setState(() => _results = const []); return; }
    // Stand-in until wired to /search backend; matches FTS contract shape.
    setState(() => _results = [
      {'title': 'Match for "$q"', 'index': _scope == 'all' ? 'companies' : _scope, 'score': '0.92'},
    ]);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Search')),
    body: Column(children: [
      Padding(
        padding: const EdgeInsets.all(12),
        child: TextField(
          controller: _ctl,
          autofocus: true,
          decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search Gigvora…', border: OutlineInputBorder()),
          onChanged: (_) => _run(),
          onSubmitted: (_) => _run(),
        ),
      ),
      SizedBox(
        height: 44,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          children: [
            for (final s in _scopes) Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(label: Text(s), selected: _scope == s, onSelected: (_) { setState(() => _scope = s); _run(); }),
            ),
          ],
        ),
      ),
      const Divider(height: 1),
      Expanded(
        child: _results.isEmpty
          ? const Center(child: Text('Type to search'))
          : ListView.builder(
              itemCount: _results.length,
              itemBuilder: (_, i) {
                final r = _results[i];
                return ListTile(
                  leading: const Icon(Icons.article_outlined),
                  title: Text(r['title']!),
                  subtitle: Text('${r['index']} · score ${r['score']}'),
                );
              },
            ),
      ),
    ]),
  );
}

class CommandPaletteScreenV2 extends StatelessWidget {
  const CommandPaletteScreenV2({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Commands')),
    body: ListView(children: const [
      ListTile(leading: Icon(Icons.home), title: Text('Go to feed'), trailing: Text('g f')),
      ListTile(leading: Icon(Icons.search), title: Text('Open search'), trailing: Text('/')),
      ListTile(leading: Icon(Icons.add), title: Text('Create post'), trailing: Text('c p')),
      ListTile(leading: Icon(Icons.add_business), title: Text('Create project'), trailing: Text('c r')),
    ]),
  );
}
