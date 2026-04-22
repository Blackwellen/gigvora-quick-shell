import 'package:dio/dio.dart';

/// Domain 29 — typed Flutter client for Interview Planning.
class InterviewPlanningApi {
  final Dio _dio;
  InterviewPlanningApi(this._dio);
  static const _base = '/api/v1/interview-planning';

  // Panels
  Future<Map<String, dynamic>> listPanels(Map<String, dynamic> f) async =>
      Map.from((await _dio.get('$_base/panels', queryParameters: f)).data as Map);
  Future<Map<String, dynamic>> panelDetail(String id) async =>
      Map.from((await _dio.get('$_base/panels/$id')).data as Map);

  // Interviews
  Future<Map<String, dynamic>> listInterviews(Map<String, dynamic> f) async =>
      Map.from((await _dio.get('$_base/interviews', queryParameters: f)).data as Map);
  Future<Map<String, dynamic>> interviewDetail(String id) async =>
      Map.from((await _dio.get('$_base/interviews/$id')).data as Map);
  Future<Map<String, dynamic>> createInterview(Map<String, dynamic> body, {String? idempotencyKey}) async =>
      Map.from((await _dio.post('$_base/interviews', data: body,
        options: Options(headers: idempotencyKey != null ? {'idempotency-key': idempotencyKey} : null),
      )).data as Map);
  Future<Map<String, dynamic>> transition(String id, String next, {String? reason}) async =>
      Map.from((await _dio.post('$_base/interviews/$id/transition', data: {'next': next, 'reason': reason})).data as Map);
  Future<Map<String, dynamic>> reschedule(String id, String startAt, String idempotencyKey, {String? reason}) async =>
      Map.from((await _dio.post('$_base/interviews/$id/reschedule', data: {
        'startAt': startAt, 'idempotencyKey': idempotencyKey, 'reason': reason, 'notifyAttendees': true,
      })).data as Map);
  Future<Map<String, dynamic>> rsvp(String id, String response) async =>
      Map.from((await _dio.post('$_base/interviews/$id/rsvp', data: {'response': response})).data as Map);

  // Scorecards
  Future<Map<String, dynamic>> listScorecards(Map<String, dynamic> f) async =>
      Map.from((await _dio.get('$_base/scorecards', queryParameters: f)).data as Map);
  Future<Map<String, dynamic>> scorecardDetail(String id) async =>
      Map.from((await _dio.get('$_base/scorecards/$id')).data as Map);
  Future<Map<String, dynamic>> draftScorecard(String id, int expectedVersion, Map<String, dynamic> patch) async =>
      Map.from((await _dio.put('$_base/scorecards/$id/draft', data: {'expectedVersion': expectedVersion, ...patch})).data as Map);
  Future<Map<String, dynamic>> submitScorecard(String id, Map<String, dynamic> payload, String idempotencyKey) async =>
      Map.from((await _dio.post('$_base/scorecards/$id/submit', data: {...payload, 'idempotencyKey': idempotencyKey})).data as Map);

  // Calibrations
  Future<Map<String, dynamic>> listCalibrations(Map<String, dynamic> f) async =>
      Map.from((await _dio.get('$_base/calibrations', queryParameters: f)).data as Map);
  Future<Map<String, dynamic>> openCalibration(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/calibrations', data: body)).data as Map);
  Future<Map<String, dynamic>> decideCalibration(String id, Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/calibrations/$id/decide', data: body)).data as Map);

  // Dashboard
  Future<Map<String, dynamic>> dashboard() async =>
      Map.from((await _dio.get('$_base/dashboard')).data as Map);
}
