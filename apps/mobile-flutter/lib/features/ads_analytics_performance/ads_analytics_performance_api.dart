import 'package:dio/dio.dart';

/// Domain 61 — Flutter client for Ads Analytics & Creative Performance.
class AdsAnalyticsPerformanceApi {
  AdsAnalyticsPerformanceApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/ads-analytics-performance';

  Future<Map<String, dynamic>> overview() async =>
      Map<String, dynamic>.from((await _dio.get('$_base/overview')).data as Map);

  Future<Map<String, dynamic>> query(Map<String, dynamic> body) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/query', data: body)).data as Map);

  Future<List<dynamic>> creativeScores({int windowDays = 7, String? band}) async =>
      List<dynamic>.from((await _dio.get('$_base/creative-scores', queryParameters: {
        'windowDays': windowDays, if (band != null) 'band': band,
      })).data as List);

  Future<void> recomputeCreativeScore(String creativeId, {int windowDays = 7}) async {
    await _dio.post('$_base/creative-scores/$creativeId/recompute',
        queryParameters: {'windowDays': windowDays});
  }

  Future<List<dynamic>> savedReports({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/saved-reports',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<List<dynamic>> alerts({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/alerts',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<void> transitionAlert(String id, String status, {String? reason}) async {
    await _dio.patch('$_base/alerts/$id/status',
        data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<List<dynamic>> anomalies({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/anomalies',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<void> transitionAnomaly(String id, String status) async {
    await _dio.patch('$_base/anomalies/$id/status', data: {'status': status});
  }

  Future<Map<String, dynamic>> detectAnomalies() async =>
      Map<String, dynamic>.from((await _dio.post('$_base/anomalies/detect')).data as Map);

  Future<Map<String, dynamic>> createExport(Map<String, dynamic> body) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/exports', data: body)).data as Map);
}
