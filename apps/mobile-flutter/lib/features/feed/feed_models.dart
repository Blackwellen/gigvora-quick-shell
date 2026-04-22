/// Typed Feed domain models. Kept lightweight (no codegen) so screens stay
/// readable. All fields nullable-safe — server payloads may evolve.
library feed_models;

class FeedPost {
  final String id;
  final String authorId;
  final String? authorName;
  final String? authorAvatar;
  final String kind;
  final String body;
  final String visibility;
  final List<Map<String, dynamic>> media;
  final Map<String, dynamic>? opportunity;
  final int reactionCount;
  final int commentCount;
  final DateTime createdAt;
  final DateTime? editedAt;
  final String? viewerReaction;
  final bool viewerSaved;

  const FeedPost({
    required this.id,
    required this.authorId,
    this.authorName,
    this.authorAvatar,
    required this.kind,
    required this.body,
    required this.visibility,
    required this.media,
    this.opportunity,
    required this.reactionCount,
    required this.commentCount,
    required this.createdAt,
    this.editedAt,
    this.viewerReaction,
    this.viewerSaved = false,
  });

  factory FeedPost.fromJson(Map<String, dynamic> j) => FeedPost(
    id: j['id'] as String,
    authorId: j['author_id'] as String? ?? j['authorId'] as String? ?? '',
    authorName: j['author_name'] as String? ?? j['authorName'] as String?,
    authorAvatar: j['author_avatar'] as String? ?? j['authorAvatar'] as String?,
    kind: j['kind'] as String? ?? 'text',
    body: j['body'] as String? ?? '',
    visibility: j['visibility'] as String? ?? 'public',
    media: ((j['media'] as List?) ?? const [])
        .map((e) => Map<String, dynamic>.from(e as Map))
        .toList(),
    opportunity: j['opportunity'] is Map ? Map<String, dynamic>.from(j['opportunity'] as Map) : null,
    reactionCount: (j['reaction_count'] ?? j['reactionCount'] ?? 0) as int,
    commentCount: (j['comment_count'] ?? j['commentCount'] ?? 0) as int,
    createdAt: DateTime.tryParse(j['created_at']?.toString() ?? j['createdAt']?.toString() ?? '') ?? DateTime.now(),
    editedAt: j['edited_at'] != null ? DateTime.tryParse(j['edited_at'].toString()) : null,
    viewerReaction: j['viewer_reaction'] as String? ?? j['viewerReaction'] as String?,
    viewerSaved: (j['viewer_saved'] ?? j['viewerSaved'] ?? false) as bool,
  );
}

class FeedComment {
  final String id;
  final String postId;
  final String authorId;
  final String? authorName;
  final String body;
  final String? parentId;
  final DateTime createdAt;

  const FeedComment({
    required this.id,
    required this.postId,
    required this.authorId,
    this.authorName,
    required this.body,
    this.parentId,
    required this.createdAt,
  });

  factory FeedComment.fromJson(Map<String, dynamic> j) => FeedComment(
    id: j['id'] as String,
    postId: j['post_id'] as String? ?? j['postId'] as String? ?? '',
    authorId: j['author_id'] as String? ?? j['authorId'] as String? ?? '',
    authorName: j['author_name'] as String? ?? j['authorName'] as String?,
    body: j['body'] as String? ?? '',
    parentId: j['parent_id'] as String? ?? j['parentId'] as String?,
    createdAt: DateTime.tryParse(j['created_at']?.toString() ?? j['createdAt']?.toString() ?? '') ?? DateTime.now(),
  );
}
