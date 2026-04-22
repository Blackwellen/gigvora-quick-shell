import 'package:dio/dio.dart';

/// Domain 59 — Flutter client for Payouts, Escrow, Finops & Hold Management.
class PayoutsEscrowFinopsApi {
  PayoutsEscrowFinopsApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/payouts-escrow-finops';

  Future<Map<String, dynamic>> overview() async =>
      Map<String, dynamic>.from((await _dio.get('$_base/overview')).data as Map);

  Future<List<dynamic>> accounts() async =>
      List<dynamic>.from((await _dio.get('$_base/accounts')).data as List);

  Future<List<dynamic>> payouts({String? status}) async {
    final r = await _dio.get('$_base/payouts', queryParameters: {if (status != null) 'status': status});
    final data = r.data;
    if (data is Map) return List<dynamic>.from(data['items'] as List? ?? const []);
    return List<dynamic>.from(data as List);
  }

  Future<Map<String, dynamic>> initiatePayout({required String accountId, required int amountMinor, int feeMinor = 0, String currency = 'GBP'}) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/payouts',
          data: {'accountId': accountId, 'amountMinor': amountMinor, 'feeMinor': feeMinor, 'currency': currency})).data as Map);

  Future<void> transitionPayout(String id, String status, {String? reason, String? externalRef}) async {
    await _dio.patch('$_base/payouts/$id/status', data: {'status': status, if (reason != null) 'reason': reason, if (externalRef != null) 'externalRef': externalRef});
  }

  Future<List<dynamic>> escrows({String? role, String? status}) async {
    final r = await _dio.get('$_base/escrows', queryParameters: {
      if (role != null) 'role': role, if (status != null) 'status': status,
    });
    return List<dynamic>.from(r.data as List);
  }

  Future<void> releaseEscrow(String id, int amountMinor, {String? reason}) async {
    await _dio.post('$_base/escrows/$id/release', data: {'amountMinor': amountMinor, if (reason != null) 'reason': reason});
  }

  Future<void> refundEscrow(String id, int amountMinor, String reason) async {
    await _dio.post('$_base/escrows/$id/refund', data: {'amountMinor': amountMinor, 'reason': reason});
  }

  Future<List<dynamic>> holds({String? status}) async {
    final r = await _dio.get('$_base/holds', queryParameters: {if (status != null) 'status': status});
    return List<dynamic>.from(r.data as List);
  }

  Future<List<dynamic>> ledger({int limit = 200}) async =>
      List<dynamic>.from((await _dio.get('$_base/ledger', queryParameters: {'limit': limit})).data as List);
}
