import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

/// Domain 07 — Notifications, Real-Time Events, Activity Routing, Badges.
class NotificationsApi {
  NotificationsApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> list({bool unreadOnly = false, String? topic, int limit = 50}) async {
    final r = await _dio.get('/api/v1/notifications', queryParameters: {
      if (unreadOnly) 'unreadOnly': true,
      if (topic != null) 'topic': topic,
      'limit': limit,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<int> unreadCount() async {
    final r = await _dio.get('/api/v1/notifications/unread-count');
    return (r.data as Map)['count'] as int;
  }

  Future<Map<String, dynamic>> markRead(List<String> ids) async {
    final r = await _dio.post('/api/v1/notifications/mark-read', data: {'ids': ids});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> markAllRead() async {
    final r = await _dio.post('/api/v1/notifications/mark-all-read');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> dismiss(String id) async {
    final r = await _dio.post('/api/v1/notifications/$id/dismiss');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> badges() async {
    final r = await _dio.get('/api/v1/notifications/badges');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> preferences() async {
    final r = await _dio.get('/api/v1/notifications/prefs');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> upsertPreference({
    required String topic, required List<String> channels,
    String digest = 'realtime', Map<String, dynamic>? quietHours,
  }) async {
    final r = await _dio.post('/api/v1/notifications/prefs', data: {
      'topic': topic, 'channels': channels, 'digest': digest,
      if (quietHours != null) 'quietHours': quietHours,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> registerDevice({
    required String platform, required String token, String? label, String? idempotencyKey,
  }) async {
    final r = await _dio.post('/api/v1/notifications/devices',
      data: {'platform': platform, 'token': token, if (label != null) 'label': label},
      options: idempotencyKey == null ? null : Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> devices() async {
    final r = await _dio.get('/api/v1/notifications/devices');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> activity({int limit = 50}) async {
    final r = await _dio.get('/api/v1/notifications/activity', queryParameters: {'limit': limit});
    return List<dynamic>.from(r.data as List);
  }
}

final notificationsApiProvider = Provider<NotificationsApi>((ref) => NotificationsApi(ref.read(apiClientProvider)));
