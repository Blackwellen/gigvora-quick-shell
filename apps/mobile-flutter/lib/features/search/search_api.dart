import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

/// Domain 05 — Global Search, Command Palette, Shortcuts & Cross-Linking (mobile parity).
class SearchApi {
  SearchApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> search(String q, {String? scope, List<String>? tags, int limit = 20, int offset = 0}) async {
    final r = await _dio.get('/api/v1/search', queryParameters: {
      'q': q, if (scope != null) 'scope': scope,
      if (tags != null && tags.isNotEmpty) 'tags': tags,
      'limit': limit, 'offset': offset,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> facets(String q) async {
    final r = await _dio.get('/api/v1/search/facets', queryParameters: {'q': q});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> autocomplete(String q, {String? scope, int limit = 8}) async {
    final r = await _dio.get('/api/v1/search/autocomplete', queryParameters: {
      'q': q, if (scope != null) 'scope': scope, 'limit': limit,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> trackClick({required String query, required String clickedId, required String clickedIndex, String? scope}) async {
    await _dio.post('/api/v1/search/track', data: {
      'query': query, 'clickedId': clickedId, 'clickedIndex': clickedIndex,
      if (scope != null) 'scope': scope,
    });
  }

  Future<Map<String, dynamic>> recent() async {
    final r = await _dio.get('/api/v1/search/recent');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> trending() async {
    final r = await _dio.get('/api/v1/search/trending');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> savedSearches() async {
    final r = await _dio.get('/api/v1/search/saved');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> saveSearch({
    required String name, required String query, String? scope,
    bool pinned = false, bool notify = false, String? idempotencyKey,
  }) async {
    final r = await _dio.post('/api/v1/search/saved',
      data: {
        'name': name, 'query': query,
        if (scope != null) 'scope': scope, 'pinned': pinned, 'notify': notify,
      },
      options: idempotencyKey == null ? null : Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> paletteActions({String roles = 'user', String entitlements = ''}) async {
    final r = await _dio.get('/api/v1/search/palette/actions', queryParameters: {
      'roles': roles, 'entitlements': entitlements,
    });
    return List<dynamic>.from(r.data as List);
  }

  Future<List<dynamic>> linksFor(String indexName, String id) async {
    final r = await _dio.get('/api/v1/search/links/$indexName/$id');
    return List<dynamic>.from(r.data as List);
  }
}

final searchApiProvider = Provider<SearchApi>((ref) => SearchApi(ref.read(apiClientProvider)));
