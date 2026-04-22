import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'feed_api.dart';
import 'feed_models.dart';

/// Riverpod state for Domain 09 — Feed.
/// All async notifiers expose loading/error/empty/success uniformly so screens
/// can rely on `AsyncStateView` from core/async_state.dart.

class FeedListState {
  final List<FeedPost> posts;
  final bool hasMore;
  final bool loadingMore;
  const FeedListState({
    this.posts = const [],
    this.hasMore = false,
    this.loadingMore = false,
  });

  FeedListState copyWith({
    List<FeedPost>? posts,
    bool? hasMore,
    bool? loadingMore,
  }) => FeedListState(
    posts: posts ?? this.posts,
    hasMore: hasMore ?? this.hasMore,
    loadingMore: loadingMore ?? this.loadingMore,
  );
}

class FeedListController extends AsyncNotifier<FeedListState> {
  String? _reason;

  @override
  Future<FeedListState> build() async {
    final api = ref.read(feedApiProvider);
    final page = await api.home(limit: 20, reason: _reason);
    return FeedListState(
      posts: page.items.map(FeedPost.fromJson).toList(),
      hasMore: page.hasMore,
    );
  }

  Future<void> refresh({ String? reason }) async {
    _reason = reason;
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(build);
  }

  Future<void> loadMore() async {
    final cur = state.valueOrNull;
    if (cur == null || !cur.hasMore || cur.loadingMore) return;
    state = AsyncValue.data(cur.copyWith(loadingMore: true));
    try {
      final api = ref.read(feedApiProvider);
      final next = await api.home(limit: 20, reason: _reason);
      final merged = [...cur.posts, ...next.items.map(FeedPost.fromJson)];
      state = AsyncValue.data(FeedListState(
        posts: merged,
        hasMore: next.hasMore,
        loadingMore: false,
      ));
    } catch (e, st) {
      state = AsyncValue.data(cur.copyWith(loadingMore: false));
      // Surface the error via a one-shot provider if the screen wants to react;
      // we intentionally do not blow the whole state away on a paging error.
      Error.throwWithStackTrace(e, st);
    }
  }

  Future<void> toggleReaction(String postId, String kind) async {
    final api = ref.read(feedApiProvider);
    final cur = state.valueOrNull;
    if (cur == null) return;
    final idx = cur.posts.indexWhere((p) => p.id == postId);
    if (idx < 0) return;
    final post = cur.posts[idx];
    final wasReacted = post.viewerReaction != null;
    // Optimistic
    final optimistic = FeedPost(
      id: post.id, authorId: post.authorId, authorName: post.authorName, authorAvatar: post.authorAvatar,
      kind: post.kind, body: post.body, visibility: post.visibility, media: post.media, opportunity: post.opportunity,
      reactionCount: post.reactionCount + (wasReacted ? -1 : 1),
      commentCount: post.commentCount,
      createdAt: post.createdAt, editedAt: post.editedAt,
      viewerReaction: wasReacted ? null : kind,
      viewerSaved: post.viewerSaved,
    );
    final newPosts = [...cur.posts]..[idx] = optimistic;
    state = AsyncValue.data(cur.copyWith(posts: newPosts));
    try {
      if (wasReacted) {
        await api.unreact(postId);
      } else {
        await api.react(postId, kind);
      }
    } catch (_) {
      // Roll back
      final rollback = [...cur.posts]..[idx] = post;
      state = AsyncValue.data(cur.copyWith(posts: rollback));
      rethrow;
    }
  }

  Future<void> toggleSave(String postId) async {
    final api = ref.read(feedApiProvider);
    final cur = state.valueOrNull;
    if (cur == null) return;
    final idx = cur.posts.indexWhere((p) => p.id == postId);
    if (idx < 0) return;
    final post = cur.posts[idx];
    final optimistic = FeedPost(
      id: post.id, authorId: post.authorId, authorName: post.authorName, authorAvatar: post.authorAvatar,
      kind: post.kind, body: post.body, visibility: post.visibility, media: post.media, opportunity: post.opportunity,
      reactionCount: post.reactionCount, commentCount: post.commentCount,
      createdAt: post.createdAt, editedAt: post.editedAt,
      viewerReaction: post.viewerReaction, viewerSaved: !post.viewerSaved,
    );
    final newPosts = [...cur.posts]..[idx] = optimistic;
    state = AsyncValue.data(cur.copyWith(posts: newPosts));
    try {
      await api.toggleSave(postId);
    } catch (_) {
      final rollback = [...cur.posts]..[idx] = post;
      state = AsyncValue.data(cur.copyWith(posts: rollback));
      rethrow;
    }
  }

  Future<void> archive(String postId) async {
    final api = ref.read(feedApiProvider);
    await api.archive(postId);
    final cur = state.valueOrNull;
    if (cur == null) return;
    state = AsyncValue.data(cur.copyWith(
      posts: cur.posts.where((p) => p.id != postId).toList(),
    ));
  }
}

final feedListControllerProvider =
    AsyncNotifierProvider<FeedListController, FeedListState>(FeedListController.new);

// Single-post detail.
final feedPostProvider = FutureProvider.autoDispose.family<FeedPost, String>((ref, id) async {
  final api = ref.read(feedApiProvider);
  final m = await api.get(id);
  return FeedPost.fromJson(m);
});

// Comments for a post.
final feedCommentsProvider = FutureProvider.autoDispose.family<List<FeedComment>, String>((ref, id) async {
  final api = ref.read(feedApiProvider);
  final list = await api.comments(id);
  return list.map(FeedComment.fromJson).toList();
});

// Compose a new post.
class FeedComposeController extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<FeedPost> publish({
    required String kind,
    required String body,
    String visibility = 'public',
    List<Map<String, dynamic>> media = const [],
    Map<String, dynamic>? opportunity,
    String? idempotencyKey,
  }) async {
    state = const AsyncValue.loading();
    try {
      final api = ref.read(feedApiProvider);
      final m = await api.create({
        'kind': kind,
        'body': body,
        'visibility': visibility,
        if (media.isNotEmpty) 'media': media,
        if (opportunity != null) 'opportunity': opportunity,
      }, idempotencyKey: idempotencyKey);
      state = const AsyncValue.data(null);
      // Refresh the list so the new post shows up.
      ref.invalidate(feedListControllerProvider);
      return FeedPost.fromJson(m);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }
}

final feedComposeControllerProvider =
    AsyncNotifierProvider<FeedComposeController, void>(FeedComposeController.new);
