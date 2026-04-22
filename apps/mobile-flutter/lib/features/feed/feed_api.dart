import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

/// Domain 09 — Feed Home, Social Publishing, Opportunity Cards.
class FeedApi {
  FeedApi(this._dio);
  final Dio _dio;

  Future<FeedPage> home({ int limit = 20, String? reason, String? cursor }) async {
    final r = await _dio.get('/api/v1/feed/home', queryParameters: {
      'limit': limit,
      if (reason != null) 'reason': reason,
      if (cursor != null) 'cursor': cursor,
    });
    final data = r.data;
    if (data is List) {
      // Backwards-compat with older API.
      return FeedPage(
        items: data.map((e) => Map<String, dynamic>.from(e as Map)).toList(),
        hasMore: data.length >= limit,
      );
    }
    final m = Map<String, dynamic>.from(data as Map);
    return FeedPage(
      items: (m['items'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList(),
      hasMore: m['hasMore'] == true,
    );
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> dto, { String? idempotencyKey }) async {
    final r = await _dio.post(
      '/api/v1/feed/posts',
      data: dto,
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> get(String id) async {
    final r = await _dio.get('/api/v1/feed/posts/$id');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> update(String id, Map<String, dynamic> dto) async {
    final r = await _dio.put('/api/v1/feed/posts/$id', data: dto);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> archive(String id) async { await _dio.delete('/api/v1/feed/posts/$id'); }

  Future<Map<String, dynamic>> react(String id, String kind) async {
    final r = await _dio.post('/api/v1/feed/posts/$id/reactions', data: { 'kind': kind });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> unreact(String id) async {
    final r = await _dio.delete('/api/v1/feed/posts/$id/reactions');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<Map<String, dynamic>>> comments(String id, { int limit = 50 }) async {
    final r = await _dio.get('/api/v1/feed/posts/$id/comments', queryParameters: { 'limit': limit });
    return (r.data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> comment(String id, String body, { String? parentId }) async {
    final r = await _dio.post(
      '/api/v1/feed/posts/$id/comments',
      data: { 'body': body, if (parentId != null) 'parentId': parentId },
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> toggleSave(String id) async {
    final r = await _dio.post('/api/v1/feed/posts/$id/saves');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<Map<String, dynamic>>> saves() async {
    final r = await _dio.get('/api/v1/feed/saves');
    return (r.data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<void> follow(String id)   async { await _dio.post('/api/v1/feed/follows/$id'); }
  Future<void> unfollow(String id) async { await _dio.delete('/api/v1/feed/follows/$id'); }

  Future<List<Map<String, dynamic>>> opportunityCards({ String? kind, int limit = 12 }) async {
    final r = await _dio.get('/api/v1/feed/opportunity-cards', queryParameters: {
      if (kind != null) 'kind': kind, 'limit': limit,
    });
    return (r.data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }
}

class FeedPage {
  final List<Map<String, dynamic>> items;
  final bool hasMore;
  const FeedPage({ required this.items, required this.hasMore });
}

final feedApiProvider = Provider<FeedApi>((ref) => FeedApi(ref.read(apiClientProvider)));
