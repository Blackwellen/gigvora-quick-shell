/// Domain 17 — Inbox feature pack (Flutter parity).
///
/// Reduced-but-complete parity. The mobile variant collapses the right rail
/// into bottom sheets (LinkedContextSheet, SharedFilesSheet) and uses a
/// sticky composer bar instead of an inline footer. Notifications, deep
/// links, and offline cache are layered through OfflineCache (Group 5).
library;

import 'package:dio/dio.dart';
import '../../core/offline_cache.dart';

class InboxApi {
  final Dio _dio;
  final OfflineCache _cache;
  InboxApi(this._dio, this._cache);

  Future<Map<String, dynamic>> listThreads({String read = 'all'}) async {
    return _cache.readOrFetch(
      'inbox.threads.$read',
      ttl: const Duration(seconds: 30),
      fetch: () async {
        final r = await _dio.get('/api/v1/inbox/threads', queryParameters: {'read': read});
        return Map<String, dynamic>.from(r.data as Map);
      },
    );
  }

  Future<List<dynamic>> listMessages(String threadId, {String? cursor, int limit = 50}) async {
    final r = await _dio.get('/api/v1/inbox/threads/$threadId/messages',
        queryParameters: {'limit': limit, if (cursor != null) 'cursor': cursor});
    return List<dynamic>.from((r.data as Map)['items'] as List);
  }

  Future<Map<String, dynamic>> send(String threadId,
      {required String body, String? clientNonce, String kind = 'text'}) async {
    final r = await _dio.post('/api/v1/inbox/threads/$threadId/messages',
        data: {'body': body, 'kind': kind, if (clientNonce != null) 'clientNonce': clientNonce});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> markRead(String threadId, String uptoMessageId) async {
    final r = await _dio.post('/api/v1/inbox/threads/$threadId/read', data: {'uptoMessageId': uptoMessageId});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> unreadDigest() async {
    return _cache.readOrFetch(
      'inbox.digest',
      ttl: const Duration(seconds: 15),
      fetch: () async {
        final r = await _dio.get('/api/v1/inbox/digest/unread');
        return Map<String, dynamic>.from(r.data as Map);
      },
    );
  }

  Future<List<dynamic>> insights() async {
    final r = await _dio.get('/api/v1/inbox/insights');
    return List<dynamic>.from(r.data as List);
  }
}
