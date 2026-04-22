import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/async_state.dart';
import 'feed_models.dart';
import 'feed_providers.dart';
import 'feed_comments_sheet.dart';

/// Domain 09 — single post detail screen.
class FeedDetailScreen extends ConsumerWidget {
  final String postId;
  const FeedDetailScreen({super.key, required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final post = ref.watch(feedPostProvider(postId));
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/feed'),
        ),
        title: const Text('Post'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: AsyncStateView<FeedPost>(
        isLoading: post.isLoading,
        error: post.hasError ? post.error : null,
        data: post.valueOrNull,
        onRetry: () => ref.invalidate(feedPostProvider(postId)),
        builder: (p) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(feedPostProvider(postId)),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(children: [
                CircleAvatar(child: Text((p.authorName ?? '?').substring(0, 1).toUpperCase())),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(p.authorName ?? 'Unknown', style: Theme.of(context).textTheme.titleMedium),
                  Text('${p.kind} · ${p.visibility}',
                      style: Theme.of(context).textTheme.bodySmall),
                ])),
              ]),
              const SizedBox(height: 16),
              SelectableText(p.body, style: Theme.of(context).textTheme.bodyLarge),
              if (p.opportunity != null) ...[
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(p.opportunity!['title']?.toString() ?? '',
                          style: Theme.of(context).textTheme.titleMedium),
                      if (p.opportunity!['location'] != null) Text(p.opportunity!['location'].toString()),
                      if (p.opportunity!['comp'] != null) Text(p.opportunity!['comp'].toString()),
                      if (p.opportunity!['deadline'] != null) Text('Apply by ${p.opportunity!['deadline']}'),
                    ]),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              Row(children: [
                _StatChip(icon: Icons.thumb_up_outlined, label: '${p.reactionCount} reactions'),
                const SizedBox(width: 8),
                _StatChip(icon: Icons.mode_comment_outlined, label: '${p.commentCount} comments'),
              ]),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  builder: (_) => FeedCommentsSheet(postId: p.id),
                ),
                icon: const Icon(Icons.mode_comment_outlined),
                label: const Text('View comments'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _StatChip({required this.icon, required this.label});
  @override
  Widget build(BuildContext context) {
    return Chip(avatar: Icon(icon, size: 16), label: Text(label));
  }
}
