import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

/// Domain 03 — Identity, Auth, Verification & Onboarding (mobile parity).
class IdentityApi {
  IdentityApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> signup({
    required String email, required String password, String? displayName, bool marketingOptIn = false,
    String? idempotencyKey,
  }) async {
    final r = await _dio.post('/api/v1/identity/signup',
      data: {
        'email': email, 'password': password,
        if (displayName != null) 'displayName': displayName,
        'marketingOptIn': marketingOptIn,
      },
      options: idempotencyKey == null ? null : Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> login({
    required String email, required String password, String? mfaCode, String deviceLabel = 'mobile',
  }) async {
    final r = await _dio.post('/api/v1/identity/login', data: {
      'email': email, 'password': password,
      if (mfaCode != null) 'mfaCode': mfaCode, 'deviceLabel': deviceLabel,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> logout(String refreshToken) async {
    await _dio.post('/api/v1/identity/logout', data: {'refreshToken': refreshToken});
  }

  Future<Map<String, dynamic>> refresh(String refreshToken) async {
    final r = await _dio.post('/api/v1/identity/refresh', data: {'refreshToken': refreshToken});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> me() async {
    final r = await _dio.get('/api/v1/identity/me');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> verifyEmail(String token) async =>
      _dio.post('/api/v1/identity/email/verify', data: {'token': token});

  Future<void> resendVerification(String email) async =>
      _dio.post('/api/v1/identity/email/resend', data: {'email': email});

  Future<void> forgotPassword(String email) async =>
      _dio.post('/api/v1/identity/password/forgot', data: {'email': email});

  Future<void> resetPassword(String token, String password) async =>
      _dio.post('/api/v1/identity/password/reset', data: {'token': token, 'password': password});

  Future<Map<String, dynamic>> listSessions() async {
    final r = await _dio.get('/api/v1/identity/sessions');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> revokeSession(String id) async =>
      _dio.post('/api/v1/identity/sessions/$id/revoke');

  Future<Map<String, dynamic>> listMfa() async {
    final r = await _dio.get('/api/v1/identity/mfa');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> enrollMfa(String type, {String? label}) async {
    final r = await _dio.post('/api/v1/identity/mfa/enroll',
        data: {'type': type, if (label != null) 'label': label});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> verifyMfa(String factorId, String code) async {
    await _dio.post('/api/v1/identity/mfa/verify', data: {'factorId': factorId, 'code': code});
  }

  Future<Map<String, dynamic>?> getOnboarding() async {
    final r = await _dio.get('/api/v1/identity/onboarding');
    return r.data == null ? null : Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> patchOnboarding({
    String? status, String? currentStep, Map<String, dynamic>? payload,
  }) async {
    final r = await _dio.patch('/api/v1/identity/onboarding', data: {
      if (status != null) 'status': status,
      if (currentStep != null) 'currentStep': currentStep,
      if (payload != null) 'payload': payload,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }
}

final identityApiProvider = Provider<IdentityApi>((ref) => IdentityApi(ref.read(apiClientProvider)));
