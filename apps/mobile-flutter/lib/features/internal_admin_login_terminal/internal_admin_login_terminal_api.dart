import 'package:dio/dio.dart';

/// Domain 65 — Flutter client for Internal Admin Login Terminal.
class InternalAdminLoginTerminalApi {
  InternalAdminLoginTerminalApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/internal-admin-login-terminal';

  Future<Map<String, dynamic>> overview() async =>
      Map<String, dynamic>.from((await _dio.get('$_base/overview')).data as Map);

  Future<List<dynamic>> environments() async =>
      List<dynamic>.from((await _dio.get('$_base/environments')).data as List);

  Future<Map<String, dynamic>> login(Map<String, dynamic> body) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/login', data: body)).data as Map);

  Future<Map<String, dynamic>> stepUp(String sessionId, String code) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/step-up',
          data: {'sessionId': sessionId, 'mfaCode': code})).data as Map);

  Future<Map<String, dynamic>> switchEnvironment(String sessionId, String slug) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/switch-environment',
          data: {'sessionId': sessionId, 'environmentSlug': slug})).data as Map);

  Future<List<dynamic>> mySessions() async =>
      List<dynamic>.from((await _dio.get('$_base/sessions/mine')).data as List);

  Future<void> revokeSession(String id) async {
    await _dio.patch('$_base/sessions/$id/revoke');
  }
}
