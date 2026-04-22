import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

/// Domain 02 — Public Marketing & Conversion (mobile parity).
class MarketingApi {
  MarketingApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> listPages({
    String? surface,
    String? status,
    String? q,
    int limit = 25,
    int offset = 0,
  }) async {
    final r = await _dio.get('/api/v1/public/marketing/pages', queryParameters: {
      if (surface != null) 'surface': surface,
      if (status != null) 'status': status,
      if (q != null && q.isNotEmpty) 'q': q,
      'limit': limit,
      'offset': offset,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> getPage(String slug) async {
    final r = await _dio.get('/api/v1/public/marketing/pages/$slug');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> listLeads({
    String? status,
    int limit = 25,
    int offset = 0,
  }) async {
    final r = await _dio.get('/api/v1/public/marketing/leads', queryParameters: {
      if (status != null) 'status': status,
      'limit': limit,
      'offset': offset,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> subscribeNewsletter({
    required String email,
    List<String> topics = const ['product'],
    String source = 'mobile',
    String? idempotencyKey,
  }) async {
    final r = await _dio.post(
      '/api/v1/public/marketing/newsletter/subscribe',
      data: {'email': email, 'topics': topics, 'source': source},
      options: idempotencyKey == null
          ? null
          : Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> createLead({
    required String email,
    String? fullName,
    String? company,
    String? role,
    String? useCase,
    String? sourcePage,
    String? sourceCta,
    Map<String, dynamic> consent = const {'marketing': true},
    String? idempotencyKey,
  }) async {
    final r = await _dio.post(
      '/api/v1/public/marketing/leads',
      data: {
        'email': email,
        if (fullName != null) 'fullName': fullName,
        if (company != null) 'company': company,
        if (role != null) 'role': role,
        if (useCase != null) 'useCase': useCase,
        if (sourcePage != null) 'sourcePage': sourcePage,
        if (sourceCta != null) 'sourceCta': sourceCta,
        'consent': consent,
      },
      options: idempotencyKey == null
          ? null
          : Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> getExperiment(String key) async {
    final r = await _dio.get('/api/v1/public/marketing/cta/experiments/$key');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> recordCta({
    required String experimentKey,
    required String eventType,
    String? variantLabel,
    String? visitorId,
    String? page,
  }) async {
    await _dio.post('/api/v1/public/marketing/cta/events', data: {
      'experimentKey': experimentKey,
      'eventType': eventType,
      if (variantLabel != null) 'variantLabel': variantLabel,
      if (visitorId != null) 'visitorId': visitorId,
      if (page != null) 'page': page,
    });
  }
}

final marketingApiProvider = Provider<MarketingApi>((ref) {
  return MarketingApi(ref.read(apiClientProvider));
});
