import 'package:dio/dio.dart';

/// Domain 35 — Flutter client for Proposal Review, Compare, Shortlist & Award.
/// Mobile parity is "reduced-but-complete": shortlist + compare + award flows
/// surface as bottom sheets and sticky bars; full approver UX still lives on web.
class ProposalReviewAwardApi {
  final Dio _dio;
  ProposalReviewAwardApi(this._dio);
  static const _base = '/api/v1/proposal-review-award';
  String _idem(String s) => 'praa-$s-${DateTime.now().microsecondsSinceEpoch}';

  Future<List<dynamic>> reviews({String? projectId, List<String>? status}) async {
    final r = await _dio.get('$_base/reviews', queryParameters: {
      if (projectId != null) 'projectId': projectId,
      if (status != null) 'status': status,
    });
    return List.from(r.data as List);
  }
  Future<Map<String, dynamic>> reviewDetail(String id) async => Map.from((await _dio.get('$_base/reviews/$id')).data as Map);
  Future<Map<String, dynamic>> decide(String proposalId, String decision, {String? note, int? shortlistRank}) async =>
      Map.from((await _dio.post('$_base/reviews/decision', data: {'proposalId': proposalId, 'decision': decision, if (note != null) 'note': note, if (shortlistRank != null) 'shortlistRank': shortlistRank})).data as Map);
  Future<List<dynamic>> bulkDecide(List<String> proposalIds, String decision, {String? note}) async =>
      List.from((await _dio.post('$_base/reviews/bulk-decision', data: {'proposalIds': proposalIds, 'decision': decision, if (note != null) 'note': note})).data as List);
  Future<Map<String, dynamic>> rank(String reviewId, int? rank) async =>
      Map.from((await _dio.post('$_base/reviews/rank', data: {'reviewId': reviewId, 'rank': rank})).data as Map);
  Future<Map<String, dynamic>> addNote(String proposalId, String body, {String visibility = 'team'}) async =>
      Map.from((await _dio.post('$_base/reviews/note', data: {'proposalId': proposalId, 'body': body, 'visibility': visibility})).data as Map);

  Future<Map<String, dynamic>> compare(String projectId, List<String> proposalIds, {Map<String, dynamic>? weights}) async =>
      Map.from((await _dio.post('$_base/compare', data: {'projectId': projectId, 'proposalIds': proposalIds, if (weights != null) 'weights': weights})).data as Map);
  Future<Map<String, dynamic>> scoring(String projectId) async => Map.from((await _dio.get('$_base/scoring/$projectId')).data as Map);
  Future<Map<String, dynamic>> setWeights(String projectId, Map<String, dynamic> weights) async =>
      Map.from((await _dio.post('$_base/scoring/weights', data: {'projectId': projectId, 'weights': weights})).data as Map);

  Future<Map<String, dynamic>> draftAward(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/awards', data: {...body, 'currency': body['currency'] ?? 'GBP', 'paymentMethod': body['paymentMethod'] ?? 'card', 'triggerEscrow': body['triggerEscrow'] ?? true, 'triggerApprovalChain': body['triggerApprovalChain'] ?? true, 'acceptTos': true, 'idempotencyKey': _idem('award')})).data as Map);
  Future<List<dynamic>> awards() async => List.from((await _dio.get('$_base/awards')).data as List);
  Future<Map<String, dynamic>> cancelAward(String id) async => Map.from((await _dio.post('$_base/awards/$id/cancel')).data as Map);
  Future<Map<String, dynamic>> requestApproval(String decisionId, List<String> approverIds, {int threshold = 1, String? note}) async =>
      Map.from((await _dio.post('$_base/awards/$decisionId/approval', data: {'approverIds': approverIds, 'threshold': threshold, if (note != null) 'note': note})).data as Map);
  Future<Map<String, dynamic>> decideApproval(String approvalId, String approverId, String decision, {String? note}) async =>
      Map.from((await _dio.post('$_base/approvals/$approvalId/decide', data: {'approverId': approverId, 'decision': decision, if (note != null) 'note': note})).data as Map);
  Future<List<dynamic>> approvals() async => List.from((await _dio.get('$_base/approvals')).data as List);
  Future<Map<String, dynamic>> insights({String? projectId}) async =>
      Map.from((await _dio.get('$_base/insights', queryParameters: {if (projectId != null) 'projectId': projectId})).data as Map);
}
