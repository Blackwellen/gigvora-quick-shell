import 'package:dio/dio.dart';

/// Domain 63 — Flutter client for Donations, Purchases & Creator Commerce.
class DonationsPurchasesCommerceApi {
  DonationsPurchasesCommerceApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/donations-purchases-commerce';

  Future<Map<String, dynamic>> overview() async =>
      Map<String, dynamic>.from((await _dio.get('$_base/overview')).data as Map);

  Future<Map<String, dynamic>?> myStorefront() async {
    try {
      final r = await _dio.get('$_base/storefront/me');
      if (r.data == null) return null;
      return Map<String, dynamic>.from(r.data as Map);
    } catch (_) { return null; }
  }

  Future<List<dynamic>> products({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/products',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<List<dynamic>> tiers({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/tiers',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<List<dynamic>> myPledges({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/pledges/mine',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<Map<String, dynamic>> createPledge(String tierId) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/pledges',
          data: {'tierId': tierId})).data as Map);

  Future<void> transitionPledge(String id, String status) async {
    await _dio.patch('$_base/pledges/$id/status', data: {'status': status});
  }

  Future<List<dynamic>> myOrders({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/orders/mine',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> body) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/orders', data: body)).data as Map);

  Future<List<dynamic>> myDonations() async =>
      List<dynamic>.from((await _dio.get('$_base/donations/mine')).data as List);

  Future<Map<String, dynamic>> createDonation(Map<String, dynamic> body) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/donations', data: body)).data as Map);

  Future<List<dynamic>> ledger({int limit = 200}) async =>
      List<dynamic>.from((await _dio.get('$_base/ledger',
          queryParameters: {'limit': limit})).data as List);
}
