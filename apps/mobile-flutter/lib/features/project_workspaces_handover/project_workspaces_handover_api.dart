import 'package:dio/dio.dart';

/// Domain 37 — Flutter client for Project Workspaces & Handover.
/// Mobile parity: list workspaces, view a workspace, transition milestones,
/// submit deliverables, complete handover checklist items. Closing the
/// workspace + writing the final report stays on web.
class ProjectWorkspacesHandoverApi {
  final Dio _dio;
  ProjectWorkspacesHandoverApi(this._dio);
  static const _base = '/api/v1/project-workspaces-handover';
  String _idem(String s) => 'pwh-$s-${DateTime.now().microsecondsSinceEpoch}';

  Future<List<dynamic>> workspaces({String? projectId, String? contractId, List<String>? status}) async {
    final r = await _dio.get('$_base/workspaces', queryParameters: {
      if (projectId != null) 'projectId': projectId,
      if (contractId != null) 'contractId': contractId,
      if (status != null) 'status': status,
    });
    return List.from(r.data as List);
  }

  Future<Map<String, dynamic>> detail(String id) async =>
      Map.from((await _dio.get('$_base/workspaces/$id')).data as Map);

  Future<Map<String, dynamic>> kickoff(String id) async =>
      Map.from((await _dio.post('$_base/workspaces/$id/kickoff')).data as Map);

  Future<Map<String, dynamic>> transitionMilestone({
    required String workspaceId,
    required String milestoneId,
    required String toStatus,
    required int expectedVersion,
    String? note,
  }) async =>
      Map.from((await _dio.post('$_base/milestones/transition', data: {
        'workspaceId': workspaceId,
        'milestoneId': milestoneId,
        'toStatus': toStatus,
        'expectedVersion': expectedVersion,
        if (note != null) 'note': note,
      })).data as Map);

  Future<Map<String, dynamic>> submitDeliverable({
    required String workspaceId,
    required String milestoneId,
    required String title,
    required String url,
    String? notes,
  }) async =>
      Map.from((await _dio.post('$_base/deliverables/submit', data: {
        'workspaceId': workspaceId,
        'milestoneId': milestoneId,
        'title': title,
        'url': url,
        if (notes != null) 'notes': notes,
        'idempotencyKey': _idem('deliv'),
      })).data as Map);

  Future<Map<String, dynamic>> completeChecklistItem({
    required String workspaceId,
    required String itemId,
    String? note,
  }) async =>
      Map.from((await _dio.post('$_base/handover/complete-item', data: {
        'workspaceId': workspaceId,
        'itemId': itemId,
        if (note != null) 'note': note,
      })).data as Map);

  Future<Map<String, dynamic>> insights({String? projectId}) async => Map.from(
      (await _dio.get('$_base/insights', queryParameters: projectId != null ? {'projectId': projectId} : null)).data as Map);
}
