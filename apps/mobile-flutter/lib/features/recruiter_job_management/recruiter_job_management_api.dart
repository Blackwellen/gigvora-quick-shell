import 'package:dio/dio.dart';

/// Domain 26 — typed Flutter client for Recruiter Job Management.
class RecruiterJobManagementApi {
  final Dio _dio;
  RecruiterJobManagementApi(this._dio);
  static const _base = '/api/v1/recruiter-job-management';

  Future<Map<String, dynamic>> list(Map<String, dynamic> f) async =>
      Map.from((await _dio.get('$_base/requisitions', queryParameters: f)).data as Map);

  Future<Map<String, dynamic>> detail(String id) async =>
      Map.from((await _dio.get('$_base/requisitions/$id')).data as Map);

  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/requisitions', data: body)).data as Map);

  Future<Map<String, dynamic>> update(String id, int expectedVersion, Map<String, dynamic> patch) async =>
      Map.from((await _dio.put('$_base/requisitions/$id', data: {'expectedVersion': expectedVersion, 'patch': patch})).data as Map);

  Future<Map<String, dynamic>> transition(String id, String next, {String? reason}) async =>
      Map.from((await _dio.post('$_base/requisitions/$id/transition', data: {'next': next, 'reason': reason})).data as Map);

  Future<Map<String, dynamic>> approve(String id, String decision, {String? note}) async =>
      Map.from((await _dio.post('$_base/requisitions/$id/approval', data: {'decision': decision, 'note': note})).data as Map);

  Future<Map<String, dynamic>> assign(String id, List<String> recruiterIds) async =>
      Map.from((await _dio.post('$_base/requisitions/$id/assign', data: {'recruiterIds': recruiterIds})).data as Map);

  Future<Map<String, dynamic>> publish(String id, String idempotencyKey, {List<String>? channels}) async =>
      Map.from((await _dio.post('$_base/requisitions/$id/publish', data: {
        'idempotencyKey': idempotencyKey,
        'postingChannels': channels ?? ['internal', 'careers_site'],
      })).data as Map);

  Future<Map<String, dynamic>> bulk(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/requisitions/bulk', data: body)).data as Map);

  Future<Map<String, dynamic>> listJobs(Map<String, dynamic> f) async =>
      Map.from((await _dio.get('$_base/jobs', queryParameters: f)).data as Map);

  Future<Map<String, dynamic>> jobTransition(String id, String next) async =>
      Map.from((await _dio.post('$_base/jobs/$id/transition', data: {'next': next})).data as Map);

  Future<Map<String, dynamic>> dashboard() async => Map.from((await _dio.get('$_base/dashboard')).data as Map);
}
