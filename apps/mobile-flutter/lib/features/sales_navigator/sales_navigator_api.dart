/// Sales Navigator — typed Dio client for Flutter.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/api_client.dart';

class SalesNavigatorApi {
  SalesNavigatorApi(this._dio);
  final Dio _dio;
  static const _root = '/api/v1/sales-navigator';

  Future<Map<String, dynamic>> overview() async =>
      (await _dio.get('$_root/overview')).data as Map<String, dynamic>;

  Future<List<dynamic>> leads({Map<String, dynamic>? filters}) async {
    final res = await _dio.get('$_root/leads', queryParameters: filters);
    return (res.data['items'] as List?) ?? const [];
  }
  Future<Map<String, dynamic>?> lead(String id) async =>
      (await _dio.get('$_root/leads/$id')).data as Map<String, dynamic>?;
  Future<Map<String, dynamic>> createLead(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/leads', data: body)).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> updateLead(String id, Map<String, dynamic> body) async =>
      (await _dio.patch('$_root/leads/$id', data: body)).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> saveLead(String id) async =>
      (await _dio.post('$_root/leads/$id/save', data: {})).data as Map<String, dynamic>;

  Future<List<dynamic>> lists() async =>
      (((await _dio.get('$_root/lists')).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> createList(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/lists', data: body)).data as Map<String, dynamic>;

  Future<List<dynamic>> sequences() async =>
      (((await _dio.get('$_root/sequences')).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> createSequence(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/sequences', data: body)).data as Map<String, dynamic>;

  Future<List<dynamic>> activities({String? leadId}) async {
    final res = await _dio.get('$_root/activities',
        queryParameters: leadId != null ? {'lead_id': leadId} : null);
    return (res.data['items'] as List?) ?? const [];
  }
  Future<Map<String, dynamic>> createActivity(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/activities', data: body)).data as Map<String, dynamic>;

  Future<List<dynamic>> goals() async =>
      (((await _dio.get('$_root/goals')).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> createGoal(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/goals', data: body)).data as Map<String, dynamic>;

  Future<List<dynamic>> signals({Map<String, dynamic>? filters}) async {
    final res = await _dio.get('$_root/signals', queryParameters: filters);
    return (res.data['items'] as List?) ?? const [];
  }

  Future<List<dynamic>> accounts(String q) async =>
      (((await _dio.get('$_root/accounts/search', queryParameters: {'q': q})).data['items'] as List?) ?? const []);

  Future<List<dynamic>> seats(String workspaceId) async =>
      (((await _dio.get('$_root/seats', queryParameters: {'workspace_id': workspaceId})).data['items'] as List?) ?? const []);
  Future<Map<String, dynamic>> inviteSeat(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/seats', data: body)).data as Map<String, dynamic>;
}

final salesNavigatorApiProvider = Provider<SalesNavigatorApi>((ref) {
  return SalesNavigatorApi(ref.read(apiClientProvider));
});
