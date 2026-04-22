import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

/// Domain 08 — Settings, Preferences, Localization, Accessibility, Profile Controls.
class SettingsApi {
  SettingsApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> list({String? namespace}) async {
    final r = await _dio.get('/api/v1/settings', queryParameters: {
      if (namespace != null) 'namespace': namespace,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> upsert({
    required String namespace, required String key, required Object? value,
    String? scope, String? idempotencyKey,
  }) async {
    final r = await _dio.post('/api/v1/settings',
      data: {'namespace': namespace, 'key': key, 'value': value, if (scope != null) 'scope': scope},
      options: idempotencyKey == null ? null : Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> bulkUpsert(List<Map<String, dynamic>> items) async {
    final r = await _dio.post('/api/v1/settings/bulk', data: {'items': items});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> resetNamespace(String namespace) async {
    final r = await _dio.post('/api/v1/settings/reset', data: {'namespace': namespace});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> locales() async {
    final r = await _dio.get('/api/v1/settings/catalogue/locales');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> timezones() async {
    final r = await _dio.get('/api/v1/settings/catalogue/timezones');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> connections() async {
    final r = await _dio.get('/api/v1/settings/connections');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> revokeConnection(String id) async {
    final r = await _dio.delete('/api/v1/settings/connections/$id');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> dataRequests() async {
    final r = await _dio.get('/api/v1/settings/data-requests');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> createDataRequest({required String kind, String? reason, String? idempotencyKey}) async {
    final r = await _dio.post('/api/v1/settings/data-requests',
      data: {'kind': kind, if (reason != null) 'reason': reason},
      options: idempotencyKey == null ? null : Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return Map<String, dynamic>.from(r.data as Map);
  }
}

final settingsApiProvider = Provider<SettingsApi>((ref) => SettingsApi(ref.read(apiClientProvider)));
