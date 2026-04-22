// Domain 12 — Company detail (4-tab) with follow/edit/post actions.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'companies_providers.dart';

class CompanyDetailScreen extends ConsumerWidget {
  final String idOrSlug;
  const CompanyDetailScreen({super.key, required this.idOrSlug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(companyDetailProvider(idOrSlug));
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Company'),
          actions: [
            detail.value == null
                ? const SizedBox.shrink()
                : Builder(builder: (_) {
                    final company = (detail.value!['company'] as Map?) ?? {};
                    final viewer = (detail.value!['viewer'] as Map?) ?? {};
                    final canEdit = const ['owner','admin','editor'].contains(viewer['role']);
                    return Row(children: [
                      if (canEdit)
                        IconButton(
                          icon: const Icon(Icons.edit_outlined),
                          tooltip: 'Edit',
                          onPressed: () => context.go('/company/${company['id']}/edit'),
                        ),
                      IconButton(
                        icon: Icon(viewer['isFollowing'] == true ? Icons.notifications_active : Icons.notifications_none),
                        tooltip: viewer['isFollowing'] == true ? 'Unfollow' : 'Follow',
                        onPressed: () async {
                          final m = ref.read(companyMutationsProvider);
                          if (viewer['isFollowing'] == true) {
                            await m.unfollow('${company['id']}');
                          } else {
                            await m.follow('${company['id']}');
                          }
                        },
                      ),
                    ]);
                  }),
          ],
          bottom: const TabBar(tabs: [Tab(text: 'About'), Tab(text: 'People'), Tab(text: 'Posts'), Tab(text: 'Locations')]),
        ),
        body: AsyncStateView<Map<String, dynamic>>(
          isLoading: detail.isLoading,
          error: detail.hasError ? detail.error : null,
          data: detail.value,
          onRetry: () => ref.invalidate(companyDetailProvider(idOrSlug)),
          builder: (d) {
            final company = (d['company'] as Map?) ?? {};
            final members = (d['members'] as List?) ?? const [];
            final posts = (d['posts'] as List?) ?? const [];
            final locations = (d['locations'] as List?) ?? const [];
            final viewer = (d['viewer'] as Map?) ?? {};
            final canPost = const ['owner','admin','editor'].contains(viewer['role']);
            return TabBarView(children: [
              _AboutTab(company: company),
              _PeopleTab(companyId: '${company['id']}', members: members),
              _PostsTab(companyId: '${company['id']}', posts: posts, canPost: canPost),
              _LocationsTab(locations: locations),
            ]);
          },
        ),
      ),
    );
  }
}

class _AboutTab extends StatelessWidget {
  final Map company;
  const _AboutTab({required this.company});
  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      Text('${company['name'] ?? '—'}', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 4),
      Text('${company['tagline'] ?? ''}'),
      const SizedBox(height: 12),
      if (company['about'] != null) Text('${company['about']}'),
      const Divider(height: 32),
      ListTile(dense: true, leading: const Icon(Icons.factory_outlined), title: Text('${company['industry'] ?? '—'}')),
      ListTile(dense: true, leading: const Icon(Icons.groups_outlined), title: Text('${company['size'] ?? '—'} employees')),
      if (company['website'] != null)
        ListTile(dense: true, leading: const Icon(Icons.link), title: Text('${company['website']}')),
    ]);
  }
}

class _PeopleTab extends ConsumerWidget {
  final String companyId; final List members;
  const _PeopleTab({required this.companyId, required this.members});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncStateView<List>(
      data: members,
      isEmpty: members.isEmpty,
      emptyTitle: 'No public members',
      emptyMessage: 'When team members make their profile public, they will appear here.',
      builder: (rows) => ListView.separated(
        itemCount: rows.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (_, i) {
          final m = rows[i] as Map;
          return ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text('${m['displayName'] ?? m['identityId']}'),
            subtitle: Text('${m['title'] ?? ''}  ·  ${m['role']}'),
            trailing: PopupMenuButton<String>(
              onSelected: (v) async {
                if (v == 'remove') {
                  final ok = await confirmAction(context, title: 'Remove member', message: 'Remove ${m['displayName']} from the company?', confirmLabel: 'Remove', destructive: true);
                  if (ok) await ref.read(companyMutationsProvider).removeMember(companyId, '${m['identityId']}');
                } else if (v.startsWith('role:')) {
                  await ref.read(companyMutationsProvider).setRole(companyId, '${m['identityId']}', v.split(':')[1]);
                }
              },
              itemBuilder: (_) => const [
                PopupMenuItem(value: 'role:admin', child: Text('Make admin')),
                PopupMenuItem(value: 'role:editor', child: Text('Make editor')),
                PopupMenuItem(value: 'role:viewer', child: Text('Make viewer')),
                PopupMenuDivider(),
                PopupMenuItem(value: 'remove', child: Text('Remove')),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _PostsTab extends ConsumerStatefulWidget {
  final String companyId; final List posts; final bool canPost;
  const _PostsTab({required this.companyId, required this.posts, required this.canPost});
  @override
  ConsumerState<_PostsTab> createState() => _PT();
}

class _PT extends ConsumerState<_PostsTab> {
  final ctrl = TextEditingController();
  bool busy = false;
  @override
  void dispose() { ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Expanded(
        child: AsyncStateView<List>(
          data: widget.posts,
          isEmpty: widget.posts.isEmpty,
          emptyTitle: 'No posts yet',
          emptyMessage: widget.canPost ? 'Use the box below to publish the first update.' : 'When the team publishes updates they will appear here.',
          builder: (rows) => ListView.separated(
            itemCount: rows.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final p = rows[i] as Map;
              return ListTile(title: Text('${p['body'] ?? ''}'), subtitle: Text('${p['publishedAt'] ?? p['createdAt'] ?? ''}'));
            },
          ),
        ),
      ),
      if (widget.canPost) Padding(
        padding: EdgeInsets.only(left: 12, right: 12, top: 8, bottom: MediaQuery.of(context).viewInsets.bottom + 8),
        child: Row(children: [
          Expanded(child: TextField(controller: ctrl, decoration: const InputDecoration(hintText: 'Share an update', border: OutlineInputBorder(), isDense: true), maxLines: null)),
          const SizedBox(width: 8),
          FilledButton(
            onPressed: busy || ctrl.text.trim().isEmpty ? null : () async {
              setState(() => busy = true);
              try {
                await ref.read(companyMutationsProvider).addPost(widget.companyId, ctrl.text.trim());
                ctrl.clear();
                if (mounted) showSnack(context, 'Posted');
              } catch (e) {
                if (mounted) showSnack(context, 'Failed: $e');
              } finally { if (mounted) setState(() => busy = false); }
            },
            child: const Text('Post'),
          ),
        ]),
      ),
    ]);
  }
}

class _LocationsTab extends StatelessWidget {
  final List locations;
  const _LocationsTab({required this.locations});
  @override
  Widget build(BuildContext context) {
    return AsyncStateView<List>(
      data: locations,
      isEmpty: locations.isEmpty,
      builder: (rows) => ListView.separated(
        itemCount: rows.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (_, i) {
          final l = rows[i] as Map;
          return ListTile(leading: const Icon(Icons.place_outlined), title: Text('${l['city'] ?? ''}, ${l['country'] ?? ''}'), subtitle: Text('${l['address'] ?? ''}'));
        },
      ),
    );
  }
}
