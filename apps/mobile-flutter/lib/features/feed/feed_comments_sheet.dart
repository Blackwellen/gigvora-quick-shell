import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/async_state.dart';
import 'feed_api.dart';
import 'feed_models.dart';
import 'feed_providers.dart';

/// Modal bottom-sheet for viewing & posting comments on a post.
class FeedCommentsSheet extends ConsumerStatefulWidget {
  final String postId;
  const FeedCommentsSheet({super.key, required this.postId});
  @override
  ConsumerState<FeedCommentsSheet> createState() => _FeedCommentsSheetState();
}

class _FeedCommentsSheetState extends ConsumerState<FeedCommentsSheet> {
  final _ctrl = TextEditingController();
  bool _sending = false;

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  Future<void> _send() async {
    final body = _ctrl.text.trim();
    if (body.isEmpty) return;
    setState(() => _sending = true);
    try {
      await ref.read(feedApiProvider).comment(widget.postId, body);
      _ctrl.clear();
      ref.invalidate(feedCommentsProvider(widget.postId));
      ref.invalidate(feedPostProvider(widget.postId));
    } catch (e) {
      if (mounted) showSnack(context, 'Could not send: $e');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final comments = ref.watch(feedCommentsProvider(widget.postId));
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      builder: (_, scroll) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Column(children: [
          ListTile(
            title: const Text('Comments', style: TextStyle(fontWeight: FontWeight.bold)),
            trailing: IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: AsyncStateView<List<FeedComment>>(
              isLoading: comments.isLoading,
              error: comments.hasError ? comments.error : null,
              data: comments.valueOrNull,
              isEmpty: (comments.valueOrNull?.isEmpty ?? true),
              onRetry: () => ref.invalidate(feedCommentsProvider(widget.postId)),
              emptyTitle: 'No comments yet',
              emptyMessage: 'Be the first to share your thoughts.',
              emptyIcon: Icons.mode_comment_outlined,
              builder: (list) => ListView.separated(
                controller: scroll,
                itemCount: list.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, i) {
                  final c = list[i];
                  return ListTile(
                    leading: CircleAvatar(child: Text((c.authorName ?? '?').substring(0, 1).toUpperCase())),
                    title: Text(c.authorName ?? 'Unknown'),
                    subtitle: Text(c.body),
                  );
                },
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    minLines: 1,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      hintText: 'Add a comment…',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ),
                IconButton(
                  icon: _sending
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.send),
                  onPressed: _sending ? null : _send,
                ),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}
