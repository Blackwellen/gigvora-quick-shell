import 'package:dio/dio.dart';

/// Domain 34 — Flutter client for Proposal Builder, Bid Credits, Scope Entry
/// & Pricing Submission. Mirrors the SDK contract; the multi-step submit and
/// boost toggle are surfaced as a sticky bottom bar on mobile.
class ProposalBuilderBidCreditsApi {
  final Dio _dio;
  ProposalBuilderBidCreditsApi(this._dio);
  static const _base = '/api/v1/proposal-builder-bid-credits';
  String _idem(String scope) => 'pbb-$scope-${DateTime.now().microsecondsSinceEpoch}';

  // Proposals
  Future<List<dynamic>> list({Map<String, dynamic>? query}) async =>
      List.from((await _dio.get('$_base/proposals', queryParameters: query)).data as List);
  Future<Map<String, dynamic>> detail(String id) async =>
      Map.from((await _dio.get('$_base/proposals/$id')).data as Map);
  Future<List<dynamic>> byProject(String projectId) async =>
      List.from((await _dio.get('$_base/projects/$projectId/proposals')).data as List);
  Future<Map<String, dynamic>> draft(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/proposals', data: body)).data as Map);
  Future<Map<String, dynamic>> update(String id, int expectedVersion, Map<String, dynamic> patch) async =>
      Map.from((await _dio.put('$_base/proposals/$id', data: {'expectedVersion': expectedVersion, 'patch': patch})).data as Map);
  Future<Map<String, dynamic>> submit(String proposalId) async =>
      Map.from((await _dio.post('$_base/proposals/submit', data: {'proposalId': proposalId, 'acceptTos': true, 'idempotencyKey': _idem('submit')})).data as Map);
  Future<Map<String, dynamic>> withdraw(String proposalId, {String? reason}) async =>
      Map.from((await _dio.post('$_base/proposals/withdraw', data: {'proposalId': proposalId, if (reason != null) 'reason': reason})).data as Map);
  Future<Map<String, dynamic>> revise(String proposalId, Map<String, dynamic> patch) async =>
      Map.from((await _dio.post('$_base/proposals/revise', data: {'proposalId': proposalId, 'patch': patch, 'idempotencyKey': _idem('revise')})).data as Map);
  Future<Map<String, dynamic>> decide(String proposalId, String decision, {String? note}) async =>
      Map.from((await _dio.post('$_base/proposals/decision', data: {'proposalId': proposalId, 'decision': decision, if (note != null) 'note': note})).data as Map);

  // Credit packs / wallet
  Future<List<dynamic>> packs() async => List.from((await _dio.get('$_base/credits/packs')).data as List);
  Future<Map<String, dynamic>> wallet() async => Map.from((await _dio.get('$_base/credits/wallet')).data as Map);
  Future<Map<String, dynamic>> createPurchase(String packId) async =>
      Map.from((await _dio.post('$_base/credits/purchases', data: {'packId': packId})).data as Map);
  Future<Map<String, dynamic>> confirmPurchase(String id, Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/credits/purchases/$id/confirm',
          data: {...body, 'acceptTos': true, 'idempotencyKey': _idem('confirm')})).data as Map);
  Future<Map<String, dynamic>> refundPurchase(String id, String reason) async =>
      Map.from((await _dio.post('$_base/credits/purchases/$id/refund', data: {'reason': reason})).data as Map);

  // Escrow
  Future<List<dynamic>> escrows() async => List.from((await _dio.get('$_base/escrows')).data as List);
  Future<Map<String, dynamic>> holdEscrow(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/escrows/hold',
          data: {...body, 'currency': body['currency'] ?? 'GBP', 'acceptTos': true, 'idempotencyKey': _idem('hold')})).data as Map);
  Future<Map<String, dynamic>> releaseEscrow(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/escrows/release', data: {...body, 'idempotencyKey': _idem('release')})).data as Map);
  Future<Map<String, dynamic>> refundEscrow(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/escrows/refund', data: {...body, 'idempotencyKey': _idem('refund')})).data as Map);

  Future<Map<String, dynamic>> insights() async => Map.from((await _dio.get('$_base/insights')).data as Map);
  Future<Map<String, dynamic>> pricingAdvice(String projectId, {int? proposedAmountCents}) async =>
      Map.from((await _dio.post('$_base/pricing-advice',
          data: {'projectId': projectId, if (proposedAmountCents != null) 'proposedAmountCents': proposedAmountCents})).data as Map);
}
