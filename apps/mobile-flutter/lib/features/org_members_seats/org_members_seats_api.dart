import 'package:dio/dio.dart';

class OrgMembersSeatsApi {
  OrgMembersSeatsApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> overview() async {
    final res = await _dio.get('/api/v1/org-members-seats/overview');
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> members({String? status, String? roleKey, String? search}) async {
    final res = await _dio.get('/api/v1/org-members-seats/members', queryParameters: {
      if (status != null) 'status': status,
      if (roleKey != null) 'roleKey': roleKey,
      if (search != null) 'search': search,
    });
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> transitionMember(String id, String status, {String? reason}) async {
    await _dio.patch('/api/v1/org-members-seats/members/$id/status',
        data: {'status': status, if (reason != null) 'reason': reason});
  }

  Future<void> changeRole(String id, String roleKey) async {
    await _dio.patch('/api/v1/org-members-seats/members/$id/role', data: {'roleKey': roleKey});
  }

  Future<List<dynamic>> invitations({String? status}) async {
    final res = await _dio.get('/api/v1/org-members-seats/invitations',
        queryParameters: {if (status != null) 'status': status});
    return List<dynamic>.from(res.data as List);
  }

  Future<void> invite({required String email, String roleKey = 'member', String seatType = 'full', String? message}) async {
    await _dio.post('/api/v1/org-members-seats/invitations',
        data: {'email': email, 'roleKey': roleKey, 'seatType': seatType, if (message != null) 'message': message});
  }

  Future<void> revokeInvitation(String id, {String? reason}) async {
    await _dio.patch('/api/v1/org-members-seats/invitations/$id/status',
        data: {'status': 'revoked', if (reason != null) 'reason': reason});
  }

  Future<List<dynamic>> seats({String? status, String? seatType}) async {
    final res = await _dio.get('/api/v1/org-members-seats/seats',
        queryParameters: {if (status != null) 'status': status, if (seatType != null) 'seatType': seatType});
    return List<dynamic>.from(res.data as List);
  }

  Future<void> assignSeat(String seatId, String memberId) async {
    await _dio.post('/api/v1/org-members-seats/seats/$seatId/assign', data: {'memberId': memberId});
  }

  Future<void> releaseSeat(String seatId) async {
    await _dio.post('/api/v1/org-members-seats/seats/$seatId/release');
  }

  Future<List<dynamic>> roles() async {
    final res = await _dio.get('/api/v1/org-members-seats/roles');
    return List<dynamic>.from(res.data as List);
  }
}
