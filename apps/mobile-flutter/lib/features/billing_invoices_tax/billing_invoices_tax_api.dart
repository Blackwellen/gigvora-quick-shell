import 'package:dio/dio.dart';

class BillingInvoicesTaxApi {
  BillingInvoicesTaxApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/billing-invoices-tax';

  Future<Map<String, dynamic>> overview() async {
    final r = await _dio.get('$_base/overview');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> invoices({String? status}) async {
    final r = await _dio.get('$_base/invoices', queryParameters: {if (status != null) 'status': status});
    final data = r.data;
    if (data is Map) return List<dynamic>.from(data['items'] as List? ?? const []);
    return List<dynamic>.from(data as List);
  }

  Future<Map<String, dynamic>> invoice(String id) async {
    final r = await _dio.get('$_base/invoices/$id');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> createInvoice(Map<String, dynamic> dto) async {
    final r = await _dio.post('$_base/invoices', data: dto);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> transitionInvoice(String id, String status, {String? reason}) async {
    await _dio.patch('$_base/invoices/$id/status', data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<void> recordPayment(String id, {required int amountMinor, String provider = 'stripe', String? providerRef}) async {
    await _dio.post('$_base/invoices/$id/payments',
      data: {'amountMinor': amountMinor, 'provider': provider, if (providerRef != null) 'providerRef': providerRef});
  }

  Future<void> remind(String id) async { await _dio.post('$_base/invoices/$id/remind'); }

  Future<List<dynamic>> subscriptions({String? status}) async {
    final r = await _dio.get('$_base/subscriptions', queryParameters: {if (status != null) 'status': status});
    return List<dynamic>.from(r.data as List);
  }

  Future<void> transitionSubscription(String id, String status, {String? reason}) async {
    await _dio.patch('$_base/subscriptions/$id/status', data: {'status': status, if (reason != null) 'reason': reason});
  }
}
