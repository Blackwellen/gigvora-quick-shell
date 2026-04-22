import 'package:dio/dio.dart';

/// Domain 33 — Flutter client for Project Posting Studio, Smart Match
/// & Invite Flows. Mirrors the SDK contract; bottom-sheet filters and a
/// sticky "Invite Selected" bar are the touch-friendly equivalents of the
/// web wizard's Match & Invite step.
class ProjectPostingSmartMatchApi {
  final Dio _dio;
  ProjectPostingSmartMatchApi(this._dio);
  static const _base = '/api/v1/project-posting-smart-match';

  Future<List<dynamic>> list() async => List.from((await _dio.get('$_base/projects')).data as List);
  Future<Map<String, dynamic>> detail(String id) async => Map.from((await _dio.get('$_base/projects/$id')).data as Map);
  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async => Map.from((await _dio.post('$_base/projects', data: body)).data as Map);
  Future<Map<String, dynamic>> update(String id, int expectedVersion, Map<String, dynamic> patch) async =>
      Map.from((await _dio.put('$_base/projects/$id', data: {'expectedVersion': expectedVersion, 'patch': patch})).data as Map);
  Future<Map<String, dynamic>> submit(String id) async => Map.from((await _dio.post('$_base/projects/$id/submit', data: {})).data as Map);
  Future<Map<String, dynamic>> decide(String id, String decision, {String? note}) async =>
      Map.from((await _dio.post('$_base/projects/$id/decision', data: {'decision': decision, if (note != null) 'note': note})).data as Map);
  Future<Map<String, dynamic>> publish(String id, Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/projects/$id/publish', data: body)).data as Map);
  Future<Map<String, dynamic>> pause(String id) async => Map.from((await _dio.post('$_base/projects/$id/pause', data: {})).data as Map);
  Future<Map<String, dynamic>> resume(String id) async => Map.from((await _dio.post('$_base/projects/$id/resume', data: {})).data as Map);
  Future<Map<String, dynamic>> archive(String id) async => Map.from((await _dio.post('$_base/projects/$id/archive', data: {})).data as Map);

  Future<Map<String, dynamic>> smartMatch(String projectId, {int topK = 12, bool diversify = true, int minScore = 60, bool excludeInvited = false}) async =>
      Map.from((await _dio.post('$_base/match', data: {
        'projectId': projectId, 'topK': topK, 'diversify': diversify, 'minScore': minScore, 'excludeInvited': excludeInvited,
      })).data as Map);
  Future<List<dynamic>> projectInvites(String projectId) async => List.from((await _dio.get('$_base/projects/$projectId/invites')).data as List);
  Future<Map<String, dynamic>> invite(Map<String, dynamic> body) async => Map.from((await _dio.post('$_base/invites', data: body)).data as Map);
  Future<List<dynamic>> inviteBulk(Map<String, dynamic> body) async => List.from((await _dio.post('$_base/invites/bulk', data: body)).data as List);
  Future<Map<String, dynamic>> decideInvite(Map<String, dynamic> body) async => Map.from((await _dio.post('$_base/invites/decision', data: body)).data as Map);
  Future<Map<String, dynamic>> revokeInvite(String id) async => Map.from((await _dio.delete('$_base/invites/$id')).data as Map);

  Future<List<dynamic>> boostPacks() async => List.from((await _dio.get('$_base/boost/packs')).data as List);
  Future<Map<String, dynamic>> boostBalance() async => Map.from((await _dio.get('$_base/boost/balance')).data as Map);
  Future<Map<String, dynamic>> createBoostPurchase(String packId) async =>
      Map.from((await _dio.post('$_base/boost/purchases', data: {'packId': packId})).data as Map);
  Future<Map<String, dynamic>> confirmBoostPurchase(String id, Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/boost/purchases/$id/confirm', data: body)).data as Map);
  Future<Map<String, dynamic>> applyBoost(Map<String, dynamic> body) async =>
      Map.from((await _dio.post('$_base/boost/apply', data: body)).data as Map);

  Future<Map<String, dynamic>> insights() async => Map.from((await _dio.get('$_base/insights')).data as Map);
}
