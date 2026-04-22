import 'package:dio/dio.dart';

class RecruiterDashboardApi {
  RecruiterDashboardApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> overview({int windowDays = 30}) async {
    final res = await _dio.get('/api/v1/recruiter-dashboard/overview',
        queryParameters: {'windowDays': windowDays});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<List<dynamic>> pipelines({String? status}) async {
    final res = await _dio.get('/api/v1/recruiter-dashboard/pipelines',
        queryParameters: {if (status != null) 'status': status});
    return List<dynamic>.from((res.data as Map)['items'] as List);
  }

  Future<void> transitionPipeline(String id, String status, {String? reason}) async {
    await _dio.patch('/api/v1/recruiter-dashboard/pipelines/$id/status',
        data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<List<dynamic>> outreach({String? status, String? pipelineId}) async {
    final res = await _dio.get('/api/v1/recruiter-dashboard/outreach',
        queryParameters: {
          if (status != null) 'status': status,
          if (pipelineId != null) 'pipelineId': pipelineId,
        });
    return List<dynamic>.from((res.data as Map)['items'] as List);
  }

  Future<List<dynamic>> tasks({String? status, String? priority}) async {
    final res = await _dio.get('/api/v1/recruiter-dashboard/tasks',
        queryParameters: {
          if (status != null) 'status': status,
          if (priority != null) 'priority': priority,
        });
    return List<dynamic>.from(res.data as List);
  }

  Future<void> transitionTask(String id, String status, {String? snoozedUntil, String? note}) async {
    await _dio.patch('/api/v1/recruiter-dashboard/tasks/$id/status',
        data: {
          'status': status,
          if (snoozedUntil != null) 'snoozedUntil': snoozedUntil,
          if (note != null) 'note': note,
        });
  }
}
