// Domain 41 — Gigs Browse, Search & Marketplace Discovery (Flutter API client).
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class GigsBrowseApi {
  GigsBrowseApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> search({
    String? q,
    int page = 1,
    int pageSize = 24,
    String sort = 'relevance',
    String? category,
    int? priceMin,
    int? priceMax,
    int? deliveryDaysMax,
    double? ratingMin,
    bool? proSellerOnly,
    bool? fastDeliveryOnly,
    List<String>? skills,
    List<String>? languages,
  }) async {
    final res = await _dio.get('/api/v1/gigs-browse/search', queryParameters: {
      if (q != null && q.isNotEmpty) 'q': q,
      'page': page,
      'pageSize': pageSize,
      'sort': sort,
      if (category != null) 'category': category,
      if (priceMin != null) 'priceMin': priceMin,
      if (priceMax != null) 'priceMax': priceMax,
      if (deliveryDaysMax != null) 'deliveryDaysMax': deliveryDaysMax,
      if (ratingMin != null) 'ratingMin': ratingMin,
      if (proSellerOnly == true) 'proSellerOnly': 'true',
      if (fastDeliveryOnly == true) 'fastDeliveryOnly': 'true',
      if (skills != null && skills.isNotEmpty) 'skills': skills,
      if (languages != null && languages.isNotEmpty) 'languages': languages,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> detail(String idOrSlug) async {
    final res = await _dio.get('/api/v1/gigs-browse/$idOrSlug');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> insights() async {
    final res = await _dio.get('/api/v1/gigs-browse/insights');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<List<dynamic>> savedSearches() async {
    final res = await _dio.get('/api/v1/gigs-browse/saved');
    return List<dynamic>.from(res.data as List);
  }

  Future<Map<String, dynamic>> upsertSavedSearch(Map<String, dynamic> body) async {
    final res = await _dio.post('/api/v1/gigs-browse/saved', data: body);
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<bool> removeSavedSearch(String id) async {
    final res = await _dio.delete('/api/v1/gigs-browse/saved/$id');
    return (res.data as Map?)?['removed'] == true;
  }

  Future<bool> toggleBookmark(String gigId) async {
    final res = await _dio.post('/api/v1/gigs-browse/$gigId/bookmark');
    return (res.data as Map?)?['bookmarked'] == true;
  }

  Future<List<String>> bookmarkIds() async {
    final res = await _dio.get('/api/v1/gigs-browse/bookmarks');
    return List<String>.from(res.data as List);
  }
}

final gigsBrowseApiProvider = Provider<GigsBrowseApi>((ref) {
  return GigsBrowseApi(ref.watch(apiClientProvider));
});
