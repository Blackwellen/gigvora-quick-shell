import 'package:dio/dio.dart';

class WalletCreditsPackagesApi {
  WalletCreditsPackagesApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/wallet-credits-packages';

  Future<Map<String, dynamic>> overview() async {
    final r = await _dio.get('$_base/overview');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> wallet() async {
    final r = await _dio.get('$_base/wallet');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> ledger({int limit = 200}) async {
    final r = await _dio.get('$_base/wallet/ledger', queryParameters: {'limit': limit});
    return List<dynamic>.from(r.data as List);
  }

  Future<Map<String, dynamic>> catalog({String? kind, String? search}) async {
    final r = await _dio.get('$_base/packages/catalog', queryParameters: {
      if (kind != null) 'kind': kind, if (search != null) 'search': search,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> purchases({String? status}) async {
    final r = await _dio.get('$_base/purchases', queryParameters: {if (status != null) 'status': status});
    final data = r.data;
    if (data is Map) return List<dynamic>.from(data['items'] as List? ?? const []);
    return List<dynamic>.from(data as List);
  }

  Future<Map<String, dynamic>> createPurchase({required String packageId, required String idempotencyKey, String? currency}) async {
    final r = await _dio.post('$_base/purchases', data: {
      'packageId': packageId, 'idempotencyKey': idempotencyKey,
      if (currency != null) 'currency': currency,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> confirmPurchase(String id, {required String providerRef, String? receiptUrl}) async {
    final r = await _dio.post('$_base/purchases/$id/confirm', data: {
      'providerRef': providerRef, if (receiptUrl != null) 'receiptUrl': receiptUrl,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> cancelPurchase(String id) async { await _dio.post('$_base/purchases/$id/cancel'); }
  Future<void> failPurchase(String id, String reason) async {
    await _dio.post('$_base/purchases/$id/fail', data: {'reason': reason});
  }
  Future<void> refundPurchase(String id, {required int amountMinor, required String reason}) async {
    await _dio.post('$_base/purchases/$id/refund', data: {'amountMinor': amountMinor, 'reason': reason});
  }

  Future<Map<String, dynamic>> spendCredits({required int amount, required String reference}) async {
    final r = await _dio.post('$_base/credits/spend', data: {'amount': amount, 'reference': reference});
    return Map<String, dynamic>.from(r.data as Map);
  }
}
