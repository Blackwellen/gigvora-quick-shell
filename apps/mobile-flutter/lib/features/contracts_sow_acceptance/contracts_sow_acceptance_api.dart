import 'package:dio/dio.dart';

/// Domain 36 — Flutter client for Contracts, SoW, Terms Acceptance & Signature.
/// Mobile parity: list contracts, view a contract, click-to-sign as the current
/// party (typed name + acceptance gates), reject, and verify hash. Drafting +
/// amendments stay on web.
class ContractsSowAcceptanceApi {
  final Dio _dio;
  ContractsSowAcceptanceApi(this._dio);
  static const _base = '/api/v1/contracts-sow-acceptance';
  String _idem(String s) => 'csa-$s-${DateTime.now().microsecondsSinceEpoch}';

  Future<List<dynamic>> contracts({String? projectId, String? proposalId, List<String>? status}) async {
    final r = await _dio.get('$_base/contracts', queryParameters: {
      if (projectId != null) 'projectId': projectId,
      if (proposalId != null) 'proposalId': proposalId,
      if (status != null) 'status': status,
    });
    return List.from(r.data as List);
  }

  Future<Map<String, dynamic>> detail(String id) async =>
      Map.from((await _dio.get('$_base/contracts/$id')).data as Map);

  Future<Map<String, dynamic>> send(String contractId, {String? message}) async =>
      Map.from((await _dio.post('$_base/contracts/send',
          data: {'contractId': contractId, if (message != null) 'message': message})).data as Map);

  Future<Map<String, dynamic>> sign({
    required String contractId,
    required String partyId,
    required String typedName,
    String? capturedIp,
    String? capturedUa,
  }) async =>
      Map.from((await _dio.post('$_base/contracts/sign', data: {
        'contractId': contractId,
        'partyId': partyId,
        'typedName': typedName,
        'acceptTos': true,
        'acceptScope': true,
        if (capturedIp != null) 'clientCapturedIp': capturedIp,
        if (capturedUa != null) 'clientCapturedUa': capturedUa,
        'idempotencyKey': _idem('sign'),
      })).data as Map);

  Future<Map<String, dynamic>> reject(String contractId, String partyId, String reason) async =>
      Map.from((await _dio.post('$_base/contracts/reject', data: {
        'contractId': contractId,
        'partyId': partyId,
        'reason': reason,
      })).data as Map);

  Future<Map<String, dynamic>> verifyHash(String contractId) async =>
      Map.from((await _dio.post('$_base/contracts/verify-hash', data: {'contractId': contractId})).data as Map);

  Future<Map<String, dynamic>> insights({String? projectId}) async => Map.from(
      (await _dio.get('$_base/insights', queryParameters: projectId != null ? {'projectId': projectId} : null)).data as Map);
}
