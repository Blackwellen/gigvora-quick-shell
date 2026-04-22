import 'package:dio/dio.dart';

/// Domain 60 — Flutter client for Ads Manager Builder.
class AdsManagerBuilderApi {
  AdsManagerBuilderApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/ads-manager-builder';

  Future<Map<String, dynamic>> overview() async =>
      Map<String, dynamic>.from((await _dio.get('$_base/overview')).data as Map);

  Future<List<dynamic>> campaigns({String? status, String? objective}) async {
    final r = await _dio.get('$_base/campaigns', queryParameters: {
      if (status != null) 'status': status,
      if (objective != null) 'objective': objective,
    });
    final data = r.data;
    if (data is Map) return List<dynamic>.from(data['items'] as List? ?? const []);
    return List<dynamic>.from(data as List);
  }

  Future<Map<String, dynamic>> getCampaign(String id) async =>
      Map<String, dynamic>.from((await _dio.get('$_base/campaigns/$id')).data as Map);

  Future<Map<String, dynamic>> createCampaign(Map<String, dynamic> dto) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/campaigns', data: dto)).data as Map);

  Future<void> transitionCampaign(String id, String status, {String? reason}) async {
    await _dio.patch('$_base/campaigns/$id/status',
        data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<List<dynamic>> creatives({String? format, String? status, String? q}) async =>
      List<dynamic>.from((await _dio.get('$_base/creatives', queryParameters: {
        if (format != null) 'format': format,
        if (status != null) 'status': status,
        if (q != null) 'q': q,
      })).data as List);

  Future<Map<String, dynamic>> createCreative(Map<String, dynamic> dto) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/creatives', data: dto)).data as Map);

  Future<void> transitionCreative(String id, String status, {String? reason}) async {
    await _dio.patch('$_base/creatives/$id/status',
        data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<List<dynamic>> adGroups(String campaignId) async =>
      List<dynamic>.from((await _dio.get('$_base/campaigns/$campaignId/ad-groups')).data as List);

  Future<Map<String, dynamic>> metrics(String campaignId, {String? from, String? to}) async =>
      Map<String, dynamic>.from((await _dio.get('$_base/campaigns/$campaignId/metrics', queryParameters: {
        if (from != null) 'from': from, if (to != null) 'to': to,
      })).data as Map);
}
