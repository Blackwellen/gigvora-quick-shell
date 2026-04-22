/// Domain 16 — Trust API client (Flutter parity).
library;

import 'package:dio/dio.dart';
import '../../core/offline_cache.dart';

class TrustApi {
  final Dio _dio;
  final OfflineCache _cache;
  TrustApi(this._dio, this._cache);

  Future<Map<String, dynamic>> listReviews({String subjectKind = 'user', String subjectId = 'me', String? direction, String? status}) async {
    return _cache.readOrFetch(
      'trust.reviews.$subjectId.$direction.$status',
      ttl: const Duration(seconds: 60),
      fetch: () async {
        final r = await _dio.get('/api/v1/trust/reviews', queryParameters: {
          'subjectKind': subjectKind, 'subjectId': subjectId,
          if (direction != null) 'direction': direction,
          if (status != null) 'status': status,
          'sort': 'recent', 'pageSize': 50,
        });
        return Map<String, dynamic>.from(r.data as Map);
      },
    );
  }

  Future<Map<String, dynamic>> score({String subjectKind = 'user', String subjectId = 'me'}) async {
    return _cache.readOrFetch('trust.score.$subjectId', ttl: const Duration(minutes: 5), fetch: () async {
      final r = await _dio.get('/api/v1/trust/score', queryParameters: {'subjectKind': subjectKind, 'subjectId': subjectId});
      return Map<String, dynamic>.from(r.data as Map);
    });
  }

  Future<Map<String, dynamic>> createReview(Map<String, dynamic> body) async {
    final r = await _dio.post('/api/v1/trust/reviews', data: body);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> dispute(String id, String reason) async {
    final r = await _dio.post('/api/v1/trust/reviews/$id/dispute', data: {'reason': reason});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> listReferences() async {
    final r = await _dio.get('/api/v1/trust/references');
    return List<dynamic>.from(r.data as List);
  }

  Future<List<dynamic>> listVerifications() async {
    final r = await _dio.get('/api/v1/trust/verifications');
    return List<dynamic>.from(r.data as List);
  }
}
