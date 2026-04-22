import 'package:dio/dio.dart';

class EnterpriseDashboardApi {
  EnterpriseDashboardApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> overview({int windowDays = 30}) async {
    final res = await _dio.get('/api/v1/enterprise-dashboard/overview',
        queryParameters: {'windowDays': windowDays});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<List<dynamic>> requisitions({String? status}) async {
    final res = await _dio.get('/api/v1/enterprise-dashboard/requisitions',
        queryParameters: {if (status != null) 'status': status});
    return List<dynamic>.from((res.data as Map)['items'] as List);
  }

  Future<void> transitionRequisition(String id, String status, {String? reason}) async {
    await _dio.patch('/api/v1/enterprise-dashboard/requisitions/$id/status',
        data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<List<dynamic>> purchaseOrders({String? status, String? category}) async {
    final res = await _dio.get('/api/v1/enterprise-dashboard/purchase-orders',
        queryParameters: {
          if (status != null) 'status': status,
          if (category != null) 'category': category,
        });
    return List<dynamic>.from(res.data as List);
  }

  Future<void> transitionPurchaseOrder(String id, String status, {String? reason, String? receivedOn}) async {
    await _dio.patch('/api/v1/enterprise-dashboard/purchase-orders/$id/status',
        data: {
          'status': status,
          if (reason != null) 'reason': reason,
          if (receivedOn != null) 'receivedOn': receivedOn,
        });
  }

  Future<List<dynamic>> teamMembers({String? status, String? department}) async {
    final res = await _dio.get('/api/v1/enterprise-dashboard/team/members',
        queryParameters: {
          if (status != null) 'status': status,
          if (department != null) 'department': department,
        });
    return List<dynamic>.from(res.data as List);
  }

  Future<List<dynamic>> tasks({String? status, String? category}) async {
    final res = await _dio.get('/api/v1/enterprise-dashboard/team/tasks',
        queryParameters: {
          if (status != null) 'status': status,
          if (category != null) 'category': category,
        });
    return List<dynamic>.from(res.data as List);
  }

  Future<void> transitionTask(String id, String status, {String? blockedReason, String? note}) async {
    await _dio.patch('/api/v1/enterprise-dashboard/team/tasks/$id/status',
        data: {
          'status': status,
          if (blockedReason != null) 'blockedReason': blockedReason,
          if (note != null) 'note': note,
        });
  }
}
