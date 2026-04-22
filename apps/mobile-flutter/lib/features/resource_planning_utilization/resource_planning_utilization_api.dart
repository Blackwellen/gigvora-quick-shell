import 'package:dio/dio.dart';

class ResourcePlanningUtilizationApi {
  ResourcePlanningUtilizationApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/resource-planning-utilization';

  Future<Map<String, dynamic>> overview() async {
    final res = await _dio.get('$_base/overview');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<List<dynamic>> utilization({required String from, required String to, String? resourceId, String? team}) async {
    final res = await _dio.get('$_base/utilization', queryParameters: {
      'from': from, 'to': to,
      if (resourceId != null) 'resourceId': resourceId,
      if (team != null) 'team': team,
    });
    return List<dynamic>.from(res.data as List);
  }

  Future<Map<String, dynamic>> resources({String? status, String? team, String? search}) async {
    final res = await _dio.get('$_base/resources', queryParameters: {
      if (status != null) 'status': status,
      if (team != null) 'team': team,
      if (search != null) 'search': search,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> projects({String? status}) async {
    final res = await _dio.get('$_base/projects', queryParameters: {if (status != null) 'status': status});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> assignments({String? status, String? resourceId, String? projectId}) async {
    final res = await _dio.get('$_base/assignments', queryParameters: {
      if (status != null) 'status': status,
      if (resourceId != null) 'resourceId': resourceId,
      if (projectId != null) 'projectId': projectId,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> createAssignment({required String resourceId, required String projectId,
      required String startDate, required String endDate, required double hoursPerWeek,
      String? role, String status = 'draft', String? notes}) async {
    await _dio.post('$_base/assignments', data: {
      'resourceId': resourceId, 'projectId': projectId,
      'startDate': startDate, 'endDate': endDate, 'hoursPerWeek': hoursPerWeek,
      if (role != null) 'role': role, 'status': status, if (notes != null) 'notes': notes,
    });
  }

  Future<void> transitionAssignment(String id, String status, {String? reason}) async {
    await _dio.patch('$_base/assignments/$id/status', data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<Map<String, dynamic>> recommend({required String projectId, String? role}) async {
    final res = await _dio.get('$_base/recommend', queryParameters: {
      'projectId': projectId, if (role != null) 'role': role,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }
}
