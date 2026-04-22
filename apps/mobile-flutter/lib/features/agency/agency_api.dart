// Domain 13 — Agency Pages, Service Presence & Public Proof Surfaces.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class AgencyApi {
  AgencyApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> list({String? q, int limit = 20, int offset = 0}) async {
    final r = await _dio.get('/api/v1/agencies', queryParameters: {
      if (q != null && q.isNotEmpty) 'q': q,
      'limit': limit,
      'offset': offset,
    });
    final data = r.data;
    if (data is List) return {'items': data, 'total': data.length, 'hasMore': false};
    return Map<String, dynamic>.from(data as Map);
  }

  Future<Map<String, dynamic>> get(String idOrSlug) async {
    final r = await _dio.get('/api/v1/agencies/$idOrSlug');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<Map<String, dynamic>>> services(String agencyId) async {
    final r = await _dio.get('/api/v1/agencies/$agencyId/services');
    final raw = r.data;
    final list = raw is List ? raw : ((raw as Map)['items'] as List? ?? const []);
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<List<Map<String, dynamic>>> caseStudies(String agencyId) async {
    final r = await _dio.get('/api/v1/agencies/$agencyId/case-studies');
    final raw = r.data;
    final list = raw is List ? raw : ((raw as Map)['items'] as List? ?? const []);
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<List<Map<String, dynamic>>> team(String agencyId) async {
    final r = await _dio.get('/api/v1/agencies/$agencyId/team');
    final raw = r.data;
    final list = raw is List ? raw : ((raw as Map)['items'] as List? ?? const []);
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> follow(String agencyId, {required bool follow, String? idempotencyKey}) async {
    final r = await _dio.post(
      '/api/v1/agencies/$agencyId/${follow ? 'follow' : 'unfollow'}',
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return Map<String, dynamic>.from(r.data as Map? ?? const {});
  }

  Future<Map<String, dynamic>> sendInquiry(String agencyId, Map<String, dynamic> body, {String? idempotencyKey}) async {
    final r = await _dio.post(
      '/api/v1/agencies/$agencyId/inquiries',
      data: body,
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return Map<String, dynamic>.from(r.data as Map);
  }
}

final agencyApiProvider = Provider<AgencyApi>((ref) => AgencyApi(ref.watch(apiClientProvider)));

final agencyListProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, q) {
  return ref.watch(agencyApiProvider).list(q: q);
});

final agencyDetailProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, idOrSlug) {
  return ref.watch(agencyApiProvider).get(idOrSlug);
});
