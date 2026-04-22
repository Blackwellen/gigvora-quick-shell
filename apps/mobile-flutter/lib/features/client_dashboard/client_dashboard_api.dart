import 'package:dio/dio.dart';

class ClientDashboardApi {
  ClientDashboardApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> overview({int windowDays = 30}) async {
    final res = await _dio.get('/api/v1/client-dashboard/overview',
        queryParameters: {'windowDays': windowDays});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<List<dynamic>> proposals({String? status}) async {
    final res = await _dio.get('/api/v1/client-dashboard/proposals',
        queryParameters: {if (status != null) 'status': status});
    return List<dynamic>.from((res.data as Map)['items'] as List);
  }

  Future<void> transitionProposal(String id, String status, {String? reason}) async {
    await _dio.patch('/api/v1/client-dashboard/proposals/$id/status',
        data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<List<dynamic>> oversight({String? status}) async {
    final res = await _dio.get('/api/v1/client-dashboard/oversight',
        queryParameters: {if (status != null) 'status': status});
    return List<dynamic>.from((res.data as Map)['items'] as List);
  }

  Future<void> transitionOversight(String id, String status, {String? note}) async {
    await _dio.patch('/api/v1/client-dashboard/oversight/$id/status',
        data: {'status': status, if (note != null) 'note': note});
  }

  Future<List<dynamic>> approvals({String? status}) async {
    final res = await _dio.get('/api/v1/client-dashboard/approvals',
        queryParameters: {if (status != null) 'status': status});
    return List<dynamic>.from(res.data as List);
  }

  Future<void> decideApproval(String id, String decision, {String? note}) async {
    await _dio.patch('/api/v1/client-dashboard/approvals/$id',
        data: {'decision': decision, if (note != null) 'note': note});
  }
}
