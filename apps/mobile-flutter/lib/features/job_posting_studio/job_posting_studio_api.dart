import 'package:dio/dio.dart';

/// Domain 24 — typed Flutter client for the Job Posting Studio.
class JobPostingStudioApi {
  final Dio _dio;
  JobPostingStudioApi(this._dio);
  static const _base = '/api/v1/job-posting-studio';

  Future<Map<String, dynamic>> list(Map<String, dynamic> f) async =>
      Map.from((await _dio.get('$_base/jobs', queryParameters: f)).data as Map);

  Future<Map<String, dynamic>> detail(String id) async =>
      Map.from((await _dio.get('$_base/jobs/$id')).data as Map);

  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/jobs', data: body)).data as Map);

  Future<Map<String, dynamic>> update(String id, int expectedVersion, Map<String, dynamic> patch) async =>
      Map.from((await _dio.put('$_base/jobs/$id', data: {'expectedVersion': expectedVersion, 'patch': patch})).data as Map);

  Future<Map<String, dynamic>> publish(String id, Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/jobs/$id/publish', data: body)).data as Map);

  Future<Map<String, dynamic>> pause(String id) async => Map.from((await _dio.post('$_base/jobs/$id/pause', data: {})).data as Map);
  Future<Map<String, dynamic>> resume(String id) async => Map.from((await _dio.post('$_base/jobs/$id/resume', data: {})).data as Map);
  Future<Map<String, dynamic>> archive(String id) async => Map.from((await _dio.post('$_base/jobs/$id/archive', data: {})).data as Map);
  Future<Map<String, dynamic>> submit(String id) async => Map.from((await _dio.post('$_base/jobs/$id/submit', data: {})).data as Map);

  Future<List<dynamic>> packs() async => List.from((await _dio.get('$_base/credits/packs')).data as List);
  Future<Map<String, dynamic>> balance() async => Map.from((await _dio.get('$_base/credits/balance')).data as Map);
  Future<Map<String, dynamic>> createPurchase(String packId) async =>
      Map.from((await _dio.post('$_base/credits/purchases', data: {'packId': packId})).data as Map);
  Future<Map<String, dynamic>> confirmPurchase(String id, Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/credits/purchases/$id/confirm', data: body)).data as Map);
}
