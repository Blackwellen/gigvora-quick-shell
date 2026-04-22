import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';
import 'jobs_browse_api.dart';

/// Domain 23 mobile parity — list + filter sheet + saved-searches drawer +
/// bookmark swipe action. Renders empty/loading/error/success/stale states.
final jobsBrowseApiProvider = Provider<JobsBrowseApi>((ref) => JobsBrowseApi(ref.watch(apiClientProvider)));

final jobsBrowseSearchProvider = FutureProvider.family<Map<String, dynamic>, Map<String, dynamic>>((ref, filters) async {
  return ref.watch(jobsBrowseApiProvider).search(filters);
});

class JobsBrowseScreen extends ConsumerStatefulWidget {
  const JobsBrowseScreen({super.key});
  @override ConsumerState<JobsBrowseScreen> createState() => _JobsBrowseScreenState();
}

class _JobsBrowseScreenState extends ConsumerState<JobsBrowseScreen> {
  Map<String, dynamic> _filters = {'page': 1, 'pageSize': 20, 'sort': 'relevance'};
  final _ctrl = TextEditingController();

  void _openFilters() {
    showModalBottomSheet(context: context, isScrollControlled: true, builder: (_) => _FilterSheet(
      initial: _filters,
      onApply: (f) { setState(() => _filters = f); Navigator.pop(context); },
    ));
  }

  void _openSavedSearches() {
    Scaffold.of(context).openEndDrawer();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(jobsBrowseSearchProvider(_filters));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Jobs'),
        actions: [
          IconButton(icon: const Icon(Icons.bookmark_border), onPressed: _openSavedSearches, tooltip: 'Saved searches'),
          IconButton(icon: const Icon(Icons.tune), onPressed: _openFilters, tooltip: 'Filters'),
        ],
      ),
      endDrawer: const _SavedSearchesDrawer(),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: _ctrl,
            decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Title, skill, company'),
            onSubmitted: (v) => setState(() => _filters = {..._filters, 'q': v}),
          ),
        ),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.cloud_off, size: 32),
              const SizedBox(height: 8),
              Text('Could not load: $e'),
              TextButton(onPressed: () => ref.invalidate(jobsBrowseSearchProvider(_filters)), child: const Text('Retry')),
            ])),
            data: (env) {
              final results = (env['results'] as List).cast<Map<String, dynamic>>();
              if (results.isEmpty) return const Center(child: Text('No matching jobs.'));
              return RefreshIndicator(
                onRefresh: () async { ref.invalidate(jobsBrowseSearchProvider(_filters)); },
                child: ListView.separated(
                  itemCount: results.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (_, i) {
                    final j = results[i];
                    return Dismissible(
                      key: ValueKey(j['id']),
                      background: Container(color: Colors.green, alignment: Alignment.centerLeft, padding: const EdgeInsets.all(16), child: const Icon(Icons.bookmark, color: Colors.white)),
                      direction: DismissDirection.startToEnd,
                      confirmDismiss: (_) async {
                        await ref.read(jobsBrowseApiProvider).toggleBookmark(j['id'] as String);
                        return false;
                      },
                      child: ListTile(
                        title: Text(j['title'] as String),
                        subtitle: Text('${(j['company'] as Map)['name']} · ${j['location']} · ${j['type']}'),
                        trailing: j['matchScore'] != null ? Chip(label: Text('${j['matchScore']}%')) : null,
                        onTap: () {},
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ]),
    );
  }
}

class _FilterSheet extends StatefulWidget {
  final Map<String, dynamic> initial; final void Function(Map<String, dynamic>) onApply;
  const _FilterSheet({required this.initial, required this.onApply});
  @override State<_FilterSheet> createState() => _FilterSheetState();
}
class _FilterSheetState extends State<_FilterSheet> {
  late Map<String, dynamic> f;
  @override void initState() { super.initState(); f = {...widget.initial}; }
  @override
  Widget build(BuildContext c) => Padding(
    padding: const EdgeInsets.all(16),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Text('Filters', style: TextStyle(fontWeight: FontWeight.bold)),
      DropdownButton<String>(
        value: f['remote'] ?? 'any',
        items: const ['any', 'remote', 'hybrid', 'onsite'].map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
        onChanged: (v) => setState(() => f['remote'] = v),
      ),
      DropdownButton<String>(
        value: f['sort'] ?? 'relevance',
        items: const ['relevance', 'newest', 'salary_desc', 'salary_asc'].map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
        onChanged: (v) => setState(() => f['sort'] = v),
      ),
      const SizedBox(height: 12),
      ElevatedButton(onPressed: () => widget.onApply(f), child: const Text('Apply')),
    ]),
  );
}
class _SavedSearchesDrawer extends ConsumerWidget {
  const _SavedSearchesDrawer();
  @override Widget build(BuildContext c, WidgetRef ref) => Drawer(child: SafeArea(child: ListView(children: const [
    ListTile(title: Text('Saved searches', style: TextStyle(fontWeight: FontWeight.bold))),
    ListTile(title: Text('No saved searches yet'), subtitle: Text('Save a search from the filter sheet to track new matches.')),
  ])));
}
