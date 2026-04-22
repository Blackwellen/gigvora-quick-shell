import 'package:dio/dio.dart';

class SharedWorkspacesCollaborationApi {
  SharedWorkspacesCollaborationApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/shared-workspaces-collaboration';

  Future<Map<String, dynamic>> overview() async {
    final res = await _dio.get('$_base/overview');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> workspaces({String? status, String? search}) async {
    final res = await _dio.get('$_base/workspaces', queryParameters: {
      if (status != null) 'status': status,
      if (search != null) 'search': search,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> createWorkspace({required String name, required String slug, String? description, String visibility = 'team'}) async {
    await _dio.post('$_base/workspaces', data: {
      'name': name, 'slug': slug, if (description != null) 'description': description, 'visibility': visibility,
    });
  }

  Future<void> archiveWorkspace(String id) async {
    await _dio.patch('$_base/workspaces/$id/status', data: {'status': 'archived'});
  }

  Future<List<dynamic>> members(String workspaceId) async {
    final res = await _dio.get('$_base/workspaces/$workspaceId/members');
    return List<dynamic>.from(res.data as List);
  }

  Future<Map<String, dynamic>> notes(String workspaceId, {String? status}) async {
    final res = await _dio.get('$_base/workspaces/$workspaceId/notes',
        queryParameters: {if (status != null) 'status': status});
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> createNote(String workspaceId, {required String title, String body = '', List<String> tags = const [], String status = 'draft', bool pinned = false}) async {
    await _dio.post('$_base/workspaces/$workspaceId/notes', data: {
      'title': title, 'body': body, 'tags': tags, 'status': status, 'pinned': pinned,
    });
  }

  Future<void> transitionNote(String workspaceId, String noteId, String status) async {
    await _dio.patch('$_base/workspaces/$workspaceId/notes/$noteId/status', data: {'status': status});
  }

  Future<Map<String, dynamic>> handoffs(String workspaceId, {String? status, bool? toMe}) async {
    final res = await _dio.get('$_base/workspaces/$workspaceId/handoffs', queryParameters: {
      if (status != null) 'status': status, if (toMe == true) 'toMe': 'true',
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> createHandoff(String workspaceId, {required String toIdentityId, required String subject, String context = '', String priority = 'normal', String? dueAt}) async {
    await _dio.post('$_base/workspaces/$workspaceId/handoffs', data: {
      'toIdentityId': toIdentityId, 'subject': subject, 'context': context, 'priority': priority,
      if (dueAt != null) 'dueAt': dueAt,
    });
  }

  Future<void> transitionHandoff(String workspaceId, String handoffId, String status, {String? reason}) async {
    await _dio.patch('$_base/workspaces/$workspaceId/handoffs/$handoffId/status',
        data: {'status': status, if (reason != null) 'reason': reason});
  }
}
