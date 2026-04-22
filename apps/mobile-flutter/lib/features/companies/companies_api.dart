// Domain 12 — Companies: enterprise mobile API on shared Dio client
// with idempotency-keyed writes.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class CompaniesPage {
  final List<Map<String, dynamic>> items;
  final bool hasMore;
  CompaniesPage({required this.items, required this.hasMore});
}

class CompaniesApi {
  CompaniesApi(this._dio);
  final Dio _dio;

  Future<CompaniesPage> list({String? q, String? industry, int page = 1, int pageSize = 20}) async {
    final r = await _dio.get('/api/v1/companies', queryParameters: {
      'page': page, 'pageSize': pageSize,
      if (q != null && q.isNotEmpty) 'q': q,
      if (industry != null && industry.isNotEmpty) 'industry': industry,
    });
    final data = r.data;
    if (data is List) {
      return CompaniesPage(items: data.map((e) => Map<String, dynamic>.from(e as Map)).toList(), hasMore: false);
    }
    final m = Map<String, dynamic>.from(data as Map);
    return CompaniesPage(
      items: ((m['items'] ?? []) as List).map((e) => Map<String, dynamic>.from(e as Map)).toList(),
      hasMore: m['hasMore'] == true,
    );
  }

  Future<Map<String, dynamic>> detail(String idOrSlug) async {
    final r = await _dio.get('/api/v1/companies/$idOrSlug');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> create(Map<String, dynamic> body, {String? idempotencyKey}) async {
    final r = await _dio.post('/api/v1/companies', data: body,
        options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> update(String id, Map<String, dynamic> patch, {String? idempotencyKey}) async {
    final r = await _dio.patch('/api/v1/companies/$id', data: patch,
        options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> follow(String id) => _dio.post('/api/v1/companies/$id/follow');
  Future<void> unfollow(String id) => _dio.delete('/api/v1/companies/$id/follow');

  Future<List<Map<String, dynamic>>> posts(String id) async {
    final r = await _dio.get('/api/v1/companies/$id/posts');
    return (r.data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> addPost(String id, String body, {String? idempotencyKey}) async {
    final r = await _dio.post('/api/v1/companies/$id/posts', data: {'body': body},
        options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<Map<String, dynamic>>> members(String id) async {
    final r = await _dio.get('/api/v1/companies/$id/members');
    return (r.data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> invite(String id, Map<String, dynamic> body, {String? idempotencyKey}) async {
    final r = await _dio.post('/api/v1/companies/$id/members', data: body,
        options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> setRole(String id, String identityId, String role) =>
      _dio.patch('/api/v1/companies/$id/members/$identityId', data: {'role': role});

  Future<void> removeMember(String id, String identityId) =>
      _dio.delete('/api/v1/companies/$id/members/$identityId');

  Future<Map<String, dynamic>?> brand(String id) async {
    final r = await _dio.get('/api/v1/companies/$id/brand');
    if (r.data == null) return null;
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> setBrand(String id, Map<String, dynamic> b, {String? idempotencyKey}) async {
    final r = await _dio.patch('/api/v1/companies/$id/brand', data: b,
        options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null);
    return Map<String, dynamic>.from(r.data as Map);
  }
}

final companiesApiProvider = Provider<CompaniesApi>((ref) => CompaniesApi(ref.watch(apiClientProvider)));
