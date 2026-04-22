import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'groups_providers.dart';
import 'groups_api.dart';

/// Domain 14 — Mobile parity screens. Reduced-but-complete: a list, a
/// detail (about + posts + members), and a compose-post sheet. Heavier
/// surfaces (moderation queue, analytics) intentionally remain web-only
/// and link out to /groups/:id/manage on mobile.

class GroupsListScreen extends ConsumerStatefulWidget {
  const GroupsListScreen({super.key});
  @override
  ConsumerState<GroupsListScreen> createState() => _GroupsListScreenState();
}

class _GroupsListScreenState extends ConsumerState<GroupsListScreen> {
  String? q;
  @override
  Widget build(BuildContext context) {
    final list = ref.watch(groupsListProvider(q));
    return Scaffold(
      appBar: AppBar(title: const Text('Groups')),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            decoration: const InputDecoration(hintText: 'Search groups…', prefixIcon: Icon(Icons.search)),
            onSubmitted: (v) => setState(() => q = v.isEmpty ? null : v),
          ),
        ),
        Expanded(child: list.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _ErrorRetry(message: e.toString(), onRetry: () => ref.invalidate(groupsListProvider(q))),
          data: (items) => items.isEmpty
            ? const Center(child: Text('No groups yet'))
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(groupsListProvider(q)),
                child: ListView.separated(
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 0),
                  itemBuilder: (ctx, i) {
                    final g = items[i];
                    return ListTile(
                      leading: const CircleAvatar(child: Icon(Icons.groups)),
                      title: Text(g['name']?.toString() ?? 'Group'),
                      subtitle: Text('${g['memberCount'] ?? 0} members · ${g['type'] ?? 'public'}'),
                      onTap: () => context.go('/groups/${g['slug'] ?? g['id']}'),
                    );
                  },
                ),
              ),
        )),
      ]),
    );
  }
}

class GroupDetailScreen extends ConsumerWidget {
  final String idOrSlug;
  const GroupDetailScreen({super.key, required this.idOrSlug});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(groupDetailProvider(idOrSlug));
    return Scaffold(
      appBar: AppBar(title: const Text('Group')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showModalBottomSheet(
          context: context, isScrollControlled: true,
          builder: (_) => GroupComposeSheet(groupId: idOrSlug),
        ),
        icon: const Icon(Icons.edit),
        label: const Text('Post'),
      ),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => _ErrorRetry(message: e.toString(), onRetry: () => ref.invalidate(groupDetailProvider(idOrSlug))),
        data: (g) {
          final id = g['id']?.toString() ?? idOrSlug;
          return DefaultTabController(
            length: 3,
            child: Column(children: [
              ListTile(
                title: Text(g['name']?.toString() ?? 'Group'),
                subtitle: Text(g['description']?.toString() ?? ''),
                trailing: FilledButton(
                  onPressed: () async {
                    final api = ref.read(groupsApiProvider);
                    await api.join(id);
                    ref.invalidate(groupDetailProvider(idOrSlug));
                  },
                  child: Text(g['joined'] == true ? 'Joined' : 'Join'),
                ),
              ),
              const TabBar(tabs: [Tab(text: 'About'), Tab(text: 'Posts'), Tab(text: 'Members')]),
              Expanded(child: TabBarView(children: [
                _AboutTab(group: g),
                _PostsTab(groupId: id),
                _MembersTab(groupId: id),
              ])),
            ]),
          );
        },
      ),
    );
  }
}

class _AboutTab extends StatelessWidget {
  final Map<String, dynamic> group;
  const _AboutTab({required this.group});
  @override
  Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(16), children: [
    Text('Category: ${group['category'] ?? '—'}'),
    const SizedBox(height: 8),
    Text('Members: ${group['memberCount'] ?? 0}'),
    const SizedBox(height: 8),
    Text('Posts (last 7d): ${group['postsLast7d'] ?? 0}'),
    const SizedBox(height: 16),
    Text(group['rules']?.toString() ?? 'No rules set.'),
  ]);
}

class _PostsTab extends ConsumerWidget {
  final String groupId;
  const _PostsTab({required this.groupId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final posts = ref.watch(groupPostsProvider(groupId));
    return posts.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(message: e.toString(), onRetry: () => ref.invalidate(groupPostsProvider(groupId))),
      data: (items) => items.isEmpty
        ? const Center(child: Text('No posts yet'))
        : ListView.separated(
            itemCount: items.length, separatorBuilder: (_, __) => const Divider(height: 0),
            itemBuilder: (ctx, i) {
              final p = items[i];
              return ListTile(
                leading: const CircleAvatar(child: Icon(Icons.person)),
                title: Text(p['body']?.toString() ?? '', maxLines: 3, overflow: TextOverflow.ellipsis),
                subtitle: Text('${p['reactionCount'] ?? 0} reactions · ${p['commentCount'] ?? 0} comments'),
              );
            },
          ),
    );
  }
}

class _MembersTab extends ConsumerWidget {
  final String groupId;
  const _MembersTab({required this.groupId});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final members = ref.watch(groupMembersProvider(groupId));
    return members.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(message: e.toString(), onRetry: () => ref.invalidate(groupMembersProvider(groupId))),
      data: (items) => items.isEmpty
        ? const Center(child: Text('No members yet'))
        : ListView.builder(
            itemCount: items.length,
            itemBuilder: (ctx, i) {
              final m = items[i];
              return ListTile(
                leading: const CircleAvatar(child: Icon(Icons.person)),
                title: Text(m['displayName']?.toString() ?? m['identityId']?.toString() ?? '—'),
                subtitle: Text(m['role']?.toString() ?? 'member'),
              );
            },
          ),
    );
  }
}

class GroupComposeSheet extends ConsumerStatefulWidget {
  final String groupId;
  const GroupComposeSheet({super.key, required this.groupId});
  @override
  ConsumerState<GroupComposeSheet> createState() => _GroupComposeSheetState();
}

class _GroupComposeSheetState extends ConsumerState<GroupComposeSheet> {
  final ctrl = TextEditingController();
  bool sending = false;
  @override
  Widget build(BuildContext context) {
    final pad = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + pad),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(
          controller: ctrl, maxLines: 5,
          decoration: const InputDecoration(hintText: 'Share something with the group…', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        SizedBox(width: double.infinity, child: FilledButton(
          onPressed: sending ? null : () async {
            setState(() => sending = true);
            try {
              final api = ref.read(groupsApiProvider);
              await api.addPost(widget.groupId, body: ctrl.text);
              ref.invalidate(groupPostsProvider(widget.groupId));
              if (context.mounted) Navigator.pop(context);
            } catch (e) {
              if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
            } finally { if (mounted) setState(() => sending = false); }
          },
          child: Text(sending ? 'Posting…' : 'Post'),
        )),
      ]),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  final String message; final VoidCallback onRetry;
  const _ErrorRetry({required this.message, required this.onRetry});
  @override
  Widget build(BuildContext context) => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, size: 32),
      const SizedBox(height: 8), Text(message, textAlign: TextAlign.center),
      const SizedBox(height: 12), FilledButton(onPressed: onRetry, child: const Text('Retry')),
    ]),
  );
}
