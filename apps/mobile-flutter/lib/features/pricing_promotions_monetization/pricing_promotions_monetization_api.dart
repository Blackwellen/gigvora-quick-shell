import 'package:dio/dio.dart';

/// Domain 64 — Flutter client for Pricing, Promotions & Monetization.
class PricingPromotionsMonetizationApi {
  PricingPromotionsMonetizationApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/pricing-promotions-monetization';

  Future<Map<String, dynamic>> overview() async =>
      Map<String, dynamic>.from((await _dio.get('$_base/overview')).data as Map);

  Future<List<dynamic>> packages({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/packages',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<List<dynamic>> promotions({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/promotions',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<Map<String, dynamic>> preview(Map<String, dynamic> body) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/preview', data: body)).data as Map);

  Future<List<dynamic>> myQuotes({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/quotes/customer',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<List<dynamic>> ownerQuotes({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/quotes/owner',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<void> transitionQuote(String id, String status) async {
    await _dio.patch('$_base/quotes/$id/status', data: {'status': status});
  }
}
