/// Enterprise Connect — typed Dio client.
/// Mirrors the web SDK envelopes so callers get the same shapes on both surfaces.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/api_client.dart';

class EnterpriseConnectApi {
  EnterpriseConnectApi(this._dio);
  final Dio _dio;
  static const _root = '/api/v1/enterprise-connect';

  Future<Map<String, dynamic>> overview() async =>
      (await _dio.get('$_root/overview')).data as Map<String, dynamic>;

  Future<Map<String, dynamic>?> myOrg() async =>
      (await _dio.get('$_root/org/me')).data as Map<String, dynamic>?;

  Future<List<dynamic>> directory({String? q, String? region}) async {
    final res = await _dio.get('$_root/directory', queryParameters: {
      if (q != null && q.isNotEmpty) 'q': q,
      if (region != null && region.isNotEmpty) 'region': region,
    });
    return (res.data['items'] as List?) ?? const [];
  }

  Future<List<dynamic>> partners() async =>
      (((await _dio.get('$_root/partners')).data['items'] as List?) ?? const []);

  Future<List<dynamic>> partnerCandidates() async =>
      (((await _dio.get('$_root/partners/candidates')).data['items'] as List?) ?? const []);

  Future<List<dynamic>> briefs({required String scope, String? status, String? category}) async {
    final res = await _dio.get('$_root/procurement/${scope == 'mine' ? 'mine' : 'discover'}',
        queryParameters: {if (status != null) 'status': status, if (category != null) 'category': category});
    return (res.data['items'] as List?) ?? const [];
  }

  Future<List<dynamic>> intros({String role = 'requester'}) async =>
      (((await _dio.get('$_root/intros', queryParameters: {'role': role})).data['items'] as List?) ?? const []);

  Future<List<dynamic>> rooms() async =>
      (((await _dio.get('$_root/rooms')).data['items'] as List?) ?? const []);

  Future<List<dynamic>> events({String scope = 'public', String? status}) async {
    final res = await _dio.get('$_root/events/$scope',
        queryParameters: {if (status != null) 'status': status});
    return (res.data['items'] as List?) ?? const [];
  }

  Future<List<dynamic>> startups({bool featured = false}) async =>
      (((await _dio.get('$_root/startups', queryParameters: {'featured': featured ? '1' : '0'})).data['items'] as List?) ?? const []);

  Future<Map<String, dynamic>?> startup(String id) async =>
      (await _dio.get('$_root/startups/$id')).data as Map<String, dynamic>?;

  Future<Map<String, dynamic>> requestIntro(Map<String, dynamic> body) async =>
      (await _dio.post('$_root/intros', data: body)).data as Map<String, dynamic>;
}

final enterpriseConnectApiProvider = Provider<EnterpriseConnectApi>((ref) {
  return EnterpriseConnectApi(ref.read(apiClientProvider));
});
