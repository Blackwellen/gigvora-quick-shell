// Domain 11 — Profiles & Reputation: enterprise mobile API.
// Uses shared Dio client + idempotency headers on every write.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class ProfilesApi {
  ProfilesApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> getProfile(String identityId) async {
    final r = await _dio.get('/api/v1/profiles/$identityId');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> updateMine(Map<String, dynamic> patch, {String? idempotencyKey}) async {
    final r = await _dio.patch(
      '/api/v1/profiles/me',
      data: patch,
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> addSkill(String skill, {String level = 'intermediate', String? idempotencyKey}) async {
    final r = await _dio.post(
      '/api/v1/profiles/me/skills',
      data: {'skill': skill, 'level': level},
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return List<dynamic>.from(r.data as List);
  }

  Future<void> removeSkill(String skillId) =>
      _dio.delete('/api/v1/profiles/me/skills/$skillId');

  Future<Map<String, dynamic>?> endorse(String identityId, String skillId) async {
    final r = await _dio.post('/api/v1/profiles/$identityId/skills/$skillId/endorse');
    if (r.data == null) return null;
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> addExperience(Map<String, dynamic> body, {String? idempotencyKey}) async {
    final r = await _dio.post(
      '/api/v1/profiles/me/experience',
      data: body,
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return List<dynamic>.from(r.data as List);
  }

  Future<void> removeExperience(String id) =>
      _dio.delete('/api/v1/profiles/me/experience/$id');

  Future<List<dynamic>> addEducation(Map<String, dynamic> body, {String? idempotencyKey}) async {
    final r = await _dio.post(
      '/api/v1/profiles/me/education',
      data: body,
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return List<dynamic>.from(r.data as List);
  }

  Future<List<dynamic>> addPortfolio(Map<String, dynamic> item, {String? idempotencyKey}) async {
    final r = await _dio.post(
      '/api/v1/profiles/me/portfolio',
      data: item,
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return List<dynamic>.from(r.data as List);
  }

  Future<void> removePortfolio(String id) =>
      _dio.delete('/api/v1/profiles/me/portfolio/$id');

  Future<Map<String, dynamic>> addReview(String subjectId, int rating, {String body = '', String? context, String? idempotencyKey}) async {
    final r = await _dio.post(
      '/api/v1/profiles/reviews',
      data: {'subjectId': subjectId, 'rating': rating, if (body.isNotEmpty) 'body': body, if (context != null) 'context': context},
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> myVerifications() async {
    final r = await _dio.get('/api/v1/profiles/me/verifications');
    return List<dynamic>.from(r.data as List);
  }

  Future<Map<String, dynamic>> requestVerification(String kind, {String? evidenceUrl, String? idempotencyKey}) async {
    final r = await _dio.post(
      '/api/v1/profiles/me/verifications',
      data: {'kind': kind, if (evidenceUrl != null) 'evidenceUrl': evidenceUrl},
      options: idempotencyKey != null ? Options(headers: {'Idempotency-Key': idempotencyKey}) : null,
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>?> getReputation(String identityId) async {
    final r = await _dio.get('/api/v1/profiles/$identityId/reputation');
    if (r.data == null) return null;
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> getBadges(String identityId) async {
    final r = await _dio.get('/api/v1/profiles/$identityId/badges');
    return List<dynamic>.from(r.data as List);
  }

  Future<Map<String, dynamic>> recomputeReputation() async {
    final r = await _dio.post('/api/v1/profiles/me/reputation/recompute');
    return Map<String, dynamic>.from(r.data as Map);
  }
}

final profilesApiProvider = Provider<ProfilesApi>((ref) => ProfilesApi(ref.watch(apiClientProvider)));
