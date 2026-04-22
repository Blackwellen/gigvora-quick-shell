import 'package:dio/dio.dart';

class AgencyManagementDashboardApi {
  AgencyManagementDashboardApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> overview({int windowDays = 30}) async {
    final res = await _dio.get('/api/v1/agency-management-dashboard/overview',
        queryParameters: {'windowDays': windowDays});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<List<dynamic>> engagements({String? status}) async {
    final res = await _dio.get('/api/v1/agency-management-dashboard/engagements',
        queryParameters: {if (status != null) 'status': status});
    return List<dynamic>.from((res.data as Map)['items'] as List);
  }

  Future<void> transitionEngagement(String id, String status, {String? reason}) async {
    await _dio.patch('/api/v1/agency-management-dashboard/engagements/$id/status',
        data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<List<dynamic>> deliverables({String? status, String? engagementId}) async {
    final res = await _dio.get('/api/v1/agency-management-dashboard/deliverables',
        queryParameters: {
          if (status != null) 'status': status,
          if (engagementId != null) 'engagementId': engagementId,
        });
    return List<dynamic>.from(res.data as List);
  }

  Future<void> transitionDeliverable(String id, String status, {String? blockedReason, String? note}) async {
    await _dio.patch('/api/v1/agency-management-dashboard/deliverables/$id/status',
        data: {
          'status': status,
          if (blockedReason != null) 'blockedReason': blockedReason,
          if (note != null) 'note': note,
        });
  }

  Future<List<dynamic>> utilizationSummary({int windowDays = 30}) async {
    final res = await _dio.get('/api/v1/agency-management-dashboard/utilization/summary',
        queryParameters: {'windowDays': windowDays});
    return List<dynamic>.from(res.data as List);
  }

  Future<List<dynamic>> invoices({String? status}) async {
    final res = await _dio.get('/api/v1/agency-management-dashboard/invoices',
        queryParameters: {if (status != null) 'status': status});
    return List<dynamic>.from(res.data as List);
  }

  Future<void> transitionInvoice(String id, String status, {String? paidOn, String? note}) async {
    await _dio.patch('/api/v1/agency-management-dashboard/invoices/$id/status',
        data: {
          'status': status,
          if (paidOn != null) 'paidOn': paidOn,
          if (note != null) 'note': note,
        });
  }
}
