import 'package:dio/dio.dart';

/// Domain 23 — typed Flutter client.
class JobsBrowseApi {
  final Dio _dio;
  JobsBrowseApi(this._dio);

  Future<Map<String, dynamic>> search(Map<String, dynamic> filters) async {
    final r = await _dio.get('/api/v1/jobs-browse/search', queryParameters: filters);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> insights() async {
    final r = await _dio.get('/api/v1/jobs-browse/insights');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> listSaved() async {
    final r = await _dio.get('/api/v1/jobs-browse/saved');
    return List<dynamic>.from(r.data as List);
  }

  Future<Map<String, dynamic>> upsertSaved(Map<String, dynamic> body) async {
    final r = await _dio.post('/api/v1/jobs-browse/saved', data: body);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<bool> removeSaved(String id) async {
    final r = await _dio.delete('/api/v1/jobs-browse/saved/$id');
    return (r.data as Map)['removed'] == true;
  }

  Future<Map<String, dynamic>> toggleBookmark(String jobId) async {
    final r = await _dio.post('/api/v1/jobs-browse/jobs/$jobId/save');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<String>> bookmarks() async {
    final r = await _dio.get('/api/v1/jobs-browse/bookmarks');
    return List<String>.from(r.data as List);
  }
}
