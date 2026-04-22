import 'package:dio/dio.dart';

/// Domain 25 — typed Flutter client for the Job Application Flow.
class JobApplicationFlowApi {
  final Dio _dio;
  JobApplicationFlowApi(this._dio);
  static const _base = '/api/v1/job-application-flow';

  Future<List<dynamic>> listTemplates({String? jobId}) async {
    final r = await _dio.get('$_base/templates', queryParameters: jobId != null ? {'jobId': jobId} : null);
    return (r.data as Map)['items'] as List;
  }

  Future<Map<String, dynamic>> template(String id) async => Map.from((await _dio.get('$_base/templates/$id')).data as Map);

  Future<Map<String, dynamic>> list(Map<String, dynamic> f) async =>
      Map.from((await _dio.get('$_base/applications', queryParameters: f)).data as Map);

  Future<Map<String, dynamic>> detail(String id) async => Map.from((await _dio.get('$_base/applications/$id')).data as Map);

  Future<Map<String, dynamic>> createDraft(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/applications', data: body)).data as Map);

  Future<Map<String, dynamic>> update(String id, int expectedVersion, Map<String, dynamic> patch) async =>
      Map.from((await _dio.put('$_base/applications/$id', data: {'expectedVersion': expectedVersion, 'patch': patch})).data as Map);

  Future<Map<String, dynamic>> submit(String id, String idempotencyKey) async =>
      Map.from((await _dio.post('$_base/applications/$id/submit', data: {'idempotencyKey': idempotencyKey})).data as Map);

  Future<Map<String, dynamic>> withdraw(String id, {String? reason}) async =>
      Map.from((await _dio.post('$_base/applications/$id/withdraw', data: {'reason': reason})).data as Map);

  Future<List<dynamic>> reviewQueue() async => (await _dio.get('$_base/reviews/queue')).data['items'] as List;

  Future<Map<String, dynamic>> decide(String id, Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/applications/$id/decision', data: body)).data as Map);

  Future<Map<String, dynamic>> bulk(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/applications/bulk', data: body)).data as Map);

  Future<Map<String, dynamic>> insights({String? jobId}) async =>
      Map.from((await _dio.get('$_base/insights', queryParameters: jobId != null ? {'jobId': jobId} : null)).data as Map);
}
