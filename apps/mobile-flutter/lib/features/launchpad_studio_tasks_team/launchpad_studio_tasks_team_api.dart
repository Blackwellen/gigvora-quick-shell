/// Pass 4 API client — Launchpad / Studio / Tasks / Team.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/api_client.dart';

class LaunchpadStudioTasksTeamApi {
  LaunchpadStudioTasksTeamApi(this._dio);
  final Dio _dio;

  // ── Experience Launchpad ──
  static const _lp = '/api/v1/experience-launchpad';
  Future<Map<String, dynamic>> lpOverview() async =>
      (await _dio.get('$_lp/overview')).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> lpDiscover({List<String> interests = const []}) async =>
      (await _dio.get('$_lp/discover', queryParameters: {'interests': interests.join(',')})).data as Map<String, dynamic>;
  Future<List<dynamic>> lpPathways({String? domain, String? level}) async =>
      (((await _dio.get('$_lp/pathways', queryParameters: {
        if (domain != null) 'domain': domain, if (level != null) 'level': level,
      })).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> lpEnroll(String pathwayId) async =>
      (await _dio.post('$_lp/enroll', data: {'pathway_id': pathwayId})).data as Map<String, dynamic>;
  Future<List<dynamic>> lpMentors({String? status}) async =>
      (((await _dio.get('$_lp/mentors', queryParameters: {if (status != null) 'status': status})).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> lpBookMentor(Map<String, dynamic> body) async =>
      (await _dio.post('$_lp/mentors/book', data: body)).data as Map<String, dynamic>;
  Future<List<dynamic>> lpChallenges({String? status}) async =>
      (((await _dio.get('$_lp/challenges', queryParameters: {if (status != null) 'status': status})).data['items'] as List?) ?? const []);
  Future<List<dynamic>> lpOpportunities({String? kind}) async =>
      (((await _dio.get('$_lp/opportunities', queryParameters: {if (kind != null) 'kind': kind})).data['items'] as List?) ?? const []);

  // ── Creation Studio ──
  static const _cs = '/api/v1/creation-studio';
  Future<List<dynamic>> studioDrafts({String? status, String? kind}) async =>
      (((await _dio.get('$_cs/drafts', queryParameters: {
        if (status != null) 'status': status, if (kind != null) 'kind': kind,
      })).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> studioCreate(Map<String, dynamic> body) async =>
      (await _dio.post('$_cs/drafts', data: body)).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> studioPublish(String id) async =>
      (await _dio.post('$_cs/drafts/$id/publish', data: {})).data as Map<String, dynamic>;

  // ── Task List ──
  static const _tl = '/api/v1/task-list';
  Future<List<dynamic>> taskLists() async =>
      (((await _dio.get('$_tl/lists')).data['items'] as List?) ?? const []);
  Future<List<dynamic>> taskItems({String? listId, String? status}) async =>
      (((await _dio.get('$_tl/items', queryParameters: {
        if (listId != null) 'list_id': listId, if (status != null) 'status': status,
      })).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> createTask(Map<String, dynamic> body) async =>
      (await _dio.post('$_tl/items', data: body)).data as Map<String, dynamic>;

  // ── Team Management ──
  static const _tm = '/api/v1/team-management';
  Future<List<dynamic>> teamMembers(String workspaceId) async =>
      (((await _dio.get('$_tm/members', queryParameters: {'workspace_id': workspaceId})).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> invite(Map<String, dynamic> body) async =>
      (await _dio.post('$_tm/invites', data: body)).data as Map<String, dynamic>;
}

final launchpadStudioTasksTeamApiProvider = Provider<LaunchpadStudioTasksTeamApi>((ref) {
  return LaunchpadStudioTasksTeamApi(ref.read(apiClientProvider));
});
