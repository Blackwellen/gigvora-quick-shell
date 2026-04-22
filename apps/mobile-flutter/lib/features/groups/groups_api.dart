// Domain 14 — Groups, Community Hubs & Member Conversations.
// Mobile API client built on the shared Dio provider with idempotency-keyed
// writes and envelope-aware list parsing.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class GroupsPage {
  final List<Map<String, dynamic>> items;
  final bool hasMore;
  final String? nextCursor;
  GroupsPage({required this.items, required this.hasMore, this.nextCursor});
}

Map<String, dynamic> _asMap(dynamic v) => Map<String, dynamic>.from(v as Map);
List<Map<String, dynamic>> _asList(dynamic v) =>
    (v as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();

GroupsPage _envelope(dynamic data) {
  if (data is List) return GroupsPage(items: _asList(data), hasMore: false);
  final m = _asMap(data);
  return GroupsPage(
    items: _asList(m['items'] ?? const []),
    hasMore: m['hasMore'] == true,
    nextCursor: m['nextCursor'] as String?,
  );
}

class GroupsApi {
  GroupsApi(this._dio);
  final Dio _dio;

  // Discovery
  Future<GroupsPage> list({String? q, String? category, String? type, bool? joined, int page = 1, int pageSize = 20, String sort = 'relevance'}) async {
    final r = await _dio.get('/api/v1/groups', queryParameters: {
      'page': page, 'pageSize': pageSize, 'sort': sort,
      if (q != null && q.isNotEmpty) 'q': q,
      if (category != null) 'category': category,
      if (type != null) 'type': type,
      if (joined != null) 'joined': joined,
    });
    return _envelope(r.data);
  }
  Future<Map<String, dynamic>> detail(String idOrSlug) async => _asMap((await _dio.get('/api/v1/groups/$idOrSlug')).data);

  // Owner CRUD
  Future<Map<String, dynamic>> create(Map<String, dynamic> body, {String? idempotencyKey}) async {
    final r = await _dio.post('/api/v1/groups', data: body, options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null);
    return _asMap(r.data);
  }
  Future<Map<String, dynamic>> update(String id, Map<String, dynamic> patch) async => _asMap((await _dio.patch('/api/v1/groups/$id', data: patch)).data);
  Future<void> pause(String id)   => _dio.post('/api/v1/groups/$id/pause');
  Future<void> archive(String id) => _dio.delete('/api/v1/groups/$id');
  Future<void> restore(String id) => _dio.post('/api/v1/groups/$id/restore');

  // Membership
  Future<GroupsPage> members(String id) async => _envelope((await _dio.get('/api/v1/groups/$id/members')).data);
  Future<Map<String, dynamic>> join(String id, {String? message}) async => _asMap((await _dio.post('/api/v1/groups/$id/join', data: {if (message != null) 'message': message})).data);
  Future<void> leave(String id) => _dio.post('/api/v1/groups/$id/leave');
  Future<Map<String, dynamic>> setRole(String id, String identityId, String role) async => _asMap((await _dio.patch('/api/v1/groups/$id/members/$identityId', data: {'role': role})).data);
  Future<void> removeMember(String id, String identityId) => _dio.delete('/api/v1/groups/$id/members/$identityId');

  // Join requests
  Future<GroupsPage> requests(String id) async => _envelope((await _dio.get('/api/v1/groups/$id/requests')).data);
  Future<Map<String, dynamic>> decideRequest(String id, String requestId, String decision, {String? reason}) async =>
      _asMap((await _dio.post('/api/v1/groups/$id/requests/$requestId/decide', data: {'decision': decision, if (reason != null) 'reason': reason})).data);

  // Channels
  Future<GroupsPage> channels(String id) async => _envelope((await _dio.get('/api/v1/groups/$id/channels')).data);
  Future<Map<String, dynamic>> addChannel(String id, Map<String, dynamic> body) async => _asMap((await _dio.post('/api/v1/groups/$id/channels', data: body)).data);

  // Posts (cursor-paginated)
  Future<GroupsPage> posts(String id, {String? channelId, int limit = 20, String? cursor}) async {
    final r = await _dio.get('/api/v1/groups/$id/posts', queryParameters: {
      'limit': limit,
      if (channelId != null) 'channelId': channelId,
      if (cursor != null) 'cursor': cursor,
    });
    return _envelope(r.data);
  }
  Future<Map<String, dynamic>> addPost(String id, Map<String, dynamic> body, {String? idempotencyKey}) async {
    final r = await _dio.post('/api/v1/groups/$id/posts', data: body, options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null);
    return _asMap(r.data);
  }
  Future<Map<String, dynamic>> moderate(String id, String postId, String action, {String? reason}) async =>
      _asMap((await _dio.post('/api/v1/groups/$id/posts/$postId/moderate', data: {'action': action, if (reason != null) 'reason': reason})).data);

  // Reactions / comments
  Future<Map<String, dynamic>> react(String id, String postId, String emoji) async =>
      _asMap((await _dio.post('/api/v1/groups/$id/posts/$postId/reactions', data: {'emoji': emoji})).data);
  Future<GroupsPage> comments(String id, String postId) async => _envelope((await _dio.get('/api/v1/groups/$id/posts/$postId/comments')).data);
  Future<Map<String, dynamic>> addComment(String id, String postId, String body, {String? parentId}) async =>
      _asMap((await _dio.post('/api/v1/groups/$id/posts/$postId/comments', data: {'body': body, if (parentId != null) 'parentId': parentId})).data);

  // Events
  Future<GroupsPage> events(String id) async => _envelope((await _dio.get('/api/v1/groups/$id/events')).data);
  Future<Map<String, dynamic>> addEvent(String id, Map<String, dynamic> body) async => _asMap((await _dio.post('/api/v1/groups/$id/events', data: body)).data);
  Future<Map<String, dynamic>> rsvp(String id, String eventId, String status) async =>
      _asMap((await _dio.post('/api/v1/groups/$id/events/$eventId/rsvp', data: {'status': status})).data);

  // Invites
  Future<GroupsPage> invite(String id, {List<String>? emails, List<String>? identityIds, String? message}) async {
    final r = await _dio.post('/api/v1/groups/$id/invites', data: {
      if (emails != null) 'emails': emails,
      if (identityIds != null) 'identityIds': identityIds,
      if (message != null) 'message': message,
    });
    return _envelope(r.data);
  }

  // Reports
  Future<Map<String, dynamic>> report(String id, {required String targetType, required String targetId, required String reason, String? notes}) async =>
      _asMap((await _dio.post('/api/v1/groups/$id/reports', data: {'targetType': targetType, 'targetId': targetId, 'reason': reason, if (notes != null) 'notes': notes})).data);
  Future<GroupsPage> reports(String id, {String status = 'open'}) async => _envelope((await _dio.get('/api/v1/groups/$id/reports', queryParameters: {'status': status})).data);
  Future<Map<String, dynamic>> resolveReport(String id, String reportId, {String status = 'resolved'}) async =>
      _asMap((await _dio.post('/api/v1/groups/$id/reports/$reportId/resolve', data: {'status': status})).data);

  // Analytics
  Future<Map<String, dynamic>> summary(String id) async => _asMap((await _dio.get('/api/v1/groups/$id/summary')).data);
}

final groupsApiProvider = Provider<GroupsApi>((ref) => GroupsApi(ref.watch(apiClientProvider)));
