// Domain 11 — Profile discovery: browse public profiles with search + filters.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';

/// Riverpod provider for the profile directory list.
final profileDirectoryProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, String>((ref, q) async {
  final dio = ref.watch(apiClientProvider);
  final r = await dio.get('/api/v1/profiles', queryParameters: {
    if (q.isNotEmpty) 'q': q,
    'limit': 30,
  });
  final data = r.data;
  if (data is List) {
    return {'items': data, 'total': data.length, 'hasMore': false};
  }
  return Map<String, dynamic>.from(data as Map);
});

class ProfileDirectoryScreen extends ConsumerStatefulWidget {
  const ProfileDirectoryScreen({super.key});
  @override
  ConsumerState<ProfileDirectoryScreen> createState() =>
      _ProfileDirectoryScreenState();
}

class _ProfileDirectoryScreenState
    extends ConsumerState<ProfileDirectoryScreen> {
  final _ctrl = TextEditingController();
  String _q = '';

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final asyncList = ref.watch(profileDirectoryProvider(_q));
    return Scaffold(
      appBar: AppBar(
        title: const Text('Discover Profiles'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: TextField(
              controller: _ctrl,
              textInputAction: TextInputAction.search,
              onSubmitted: (v) => setState(() => _q = v.trim()),
              decoration: InputDecoration(
                hintText: 'Search by name, role, or skill',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(28),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(profileDirectoryProvider(_q).future),
        child: asyncList.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(
            children: [
              const SizedBox(height: 80),
              Center(
                child: Column(children: [
                  const Icon(Icons.error_outline, size: 48),
                  const SizedBox(height: 8),
                  Text('Could not load profiles\n$e',
                      textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    onPressed: () =>
                        ref.refresh(profileDirectoryProvider(_q).future),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ]),
              ),
            ],
          ),
          data: (page) {
            final items = (page['items'] as List? ?? const [])
                .map((e) => Map<String, dynamic>.from(e as Map))
                .toList();
            if (items.isEmpty) {
              return ListView(children: const [
                SizedBox(height: 120),
                Center(child: Text('No profiles found')),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final p = items[i];
                final id = (p['identityId'] ?? p['id'] ?? '').toString();
                final name = (p['displayName'] ?? p['name'] ?? 'Unknown').toString();
                final headline = (p['headline'] ?? '').toString();
                final avatar = (p['avatarUrl'] ?? '').toString();
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundImage: avatar.isNotEmpty
                          ? NetworkImage(avatar)
                          : null,
                      child:
                          avatar.isEmpty ? Text(name.characters.first) : null,
                    ),
                    title: Text(name),
                    subtitle: headline.isNotEmpty ? Text(headline) : null,
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.go('/profile/$id'),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
