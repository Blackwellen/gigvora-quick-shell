import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'feed_models.dart';
import 'feed_providers.dart';

/// Domain 09 — Feed list screen.
/// Pull-to-refresh, infinite scroll, reason filter chip row, optimistic
/// reactions/saves, swipe-to-archive, deep-link tap → /feed/:id.
class FeedListScreen extends ConsumerStatefulWidget {
  const FeedListScreen({super.key});
  @override
  ConsumerState<FeedListScreen> createState() => _FeedListScreenState();
}

class _FeedListScreenState extends ConsumerState<FeedListScreen> {
  final _scroll = ScrollController();
  String? _reason;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400) {
        ref.read(feedListControllerProvider.notifier).loadMore();
      }
    });
  }

  @override
  void dispose() { _scroll.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(feedListControllerProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Feed'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            tooltip: 'Compose',
            onPressed: () => context.go('/feed/compose'),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(44),
          child: SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _FilterChip(label: 'For you', selected: _reason == null, onTap: () => _setReason(null)),
                _FilterChip(label: 'Following', selected: _reason == 'follow', onTap: () => _setReason('follow')),
                _FilterChip(label: 'Recommended', selected: _reason == 'recommended', onTap: () => _setReason('recommended')),
                _FilterChip(label: 'Trending', selected: _reason == 'trending', onTap: () => _setReason('trending')),
                _FilterChip(label: 'Opportunities', selected: _reason == 'opportunity', onTap: () => _setReason('opportunity')),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(feedListControllerProvider.notifier).refresh(reason: _reason),
        child: AsyncStateView<FeedListState>(
          isLoading: state.isLoading && !state.hasValue,
          error: state.hasError ? state.error : null,
          data: state.valueOrNull,
          isEmpty: (state.valueOrNull?.posts.isEmpty ?? true),
          onRetry: () => ref.read(feedListControllerProvider.notifier).refresh(reason: _reason),
          emptyTitle: 'Your feed is quiet',
          emptyMessage: 'Follow people, post something, or switch the filter to see more.',
          emptyIcon: Icons.dynamic_feed_outlined,
          builder: (data) => ListView.builder(
            controller: _scroll,
            padding: const EdgeInsets.only(bottom: 96),
            itemCount: data.posts.length + (data.hasMore ? 1 : 0),
            itemBuilder: (ctx, i) {
              if (i >= data.posts.length) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: CircularProgressIndicator.adaptive()),
                );
              }
              final post = data.posts[i];
              return _PostCard(
                post: post,
                onTap: () => context.go('/feed/${post.id}'),
                onReact: () => ref.read(feedListControllerProvider.notifier).toggleReaction(post.id, 'like'),
                onSave: () => ref.read(feedListControllerProvider.notifier).toggleSave(post.id),
                onArchive: () async {
                  final ok = await confirmAction(
                    context,
                    title: 'Archive post?',
                    message: 'It will be removed from feeds. You can find it later in your archive.',
                    confirmLabel: 'Archive',
                    destructive: true,
                  );
                  if (ok) {
                    try {
                      await ref.read(feedListControllerProvider.notifier).archive(post.id);
                      if (context.mounted) showSnack(context, 'Post archived');
                    } catch (e) {
                      if (context.mounted) showSnack(context, 'Could not archive: $e');
                    }
                  }
                },
              );
            },
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/feed/compose'),
        icon: const Icon(Icons.edit),
        label: const Text('Post'),
      ),
    );
  }

  void _setReason(String? r) {
    setState(() => _reason = r);
    ref.read(feedListControllerProvider.notifier).refresh(reason: r);
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(right: 8),
    child: ChoiceChip(label: Text(label), selected: selected, onSelected: (_) => onTap()),
  );
}

class _PostCard extends StatelessWidget {
  final FeedPost post;
  final VoidCallback onTap;
  final VoidCallback onReact;
  final VoidCallback onSave;
  final VoidCallback onArchive;
  const _PostCard({
    required this.post,
    required this.onTap,
    required this.onReact,
    required this.onSave,
    required this.onArchive,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: ValueKey('post-${post.id}'),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async { onArchive(); return false; },
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.symmetric(horizontal: 24),
        color: Theme.of(context).colorScheme.errorContainer,
        child: const Icon(Icons.archive_outlined),
      ),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              CircleAvatar(
                child: Text((post.authorName ?? '?').substring(0, 1).toUpperCase()),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(post.authorName ?? 'Unknown',
                    style: Theme.of(context).textTheme.titleSmall),
                Text(_relative(post.createdAt),
                    style: Theme.of(context).textTheme.bodySmall),
              ])),
              if (post.kind == 'opportunity')
                Chip(label: const Text('Opportunity'), visualDensity: VisualDensity.compact),
            ]),
            const SizedBox(height: 12),
            Text(post.body, maxLines: 8, overflow: TextOverflow.ellipsis),
            if (post.opportunity != null) ...[
              const SizedBox(height: 12),
              _OpportunityCard(opp: post.opportunity!),
            ],
            const SizedBox(height: 12),
            Row(children: [
              IconButton(
                onPressed: onReact,
                icon: Icon(post.viewerReaction != null ? Icons.thumb_up : Icons.thumb_up_outlined),
              ),
              Text('${post.reactionCount}'),
              const SizedBox(width: 16),
              IconButton(
                onPressed: onTap,
                icon: const Icon(Icons.mode_comment_outlined),
              ),
              Text('${post.commentCount}'),
              const Spacer(),
              IconButton(
                onPressed: onSave,
                icon: Icon(post.viewerSaved ? Icons.bookmark : Icons.bookmark_outline),
              ),
            ]),
            const Divider(height: 24),
          ]),
        ),
      ),
    );
  }

  String _relative(DateTime t) {
    final d = DateTime.now().difference(t);
    if (d.inMinutes < 1) return 'just now';
    if (d.inMinutes < 60) return '${d.inMinutes}m';
    if (d.inHours   < 24) return '${d.inHours}h';
    if (d.inDays    < 7)  return '${d.inDays}d';
    return '${t.year}-${t.month.toString().padLeft(2, '0')}-${t.day.toString().padLeft(2, '0')}';
  }
}

class _OpportunityCard extends StatelessWidget {
  final Map<String, dynamic> opp;
  const _OpportunityCard({required this.opp});
  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(opp['title']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium),
          if (opp['location'] != null) Text(opp['location'].toString()),
          if (opp['comp'] != null) Text(opp['comp'].toString()),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: FilledButton.tonal(
              onPressed: () {},
              child: const Text('View opportunity'),
            ),
          ),
        ]),
      ),
    );
  }
}
