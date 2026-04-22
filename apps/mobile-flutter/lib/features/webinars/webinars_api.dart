import 'package:dio/dio.dart';

/// Domain 22 — typed Flutter client.
class WebinarsApi {
  final Dio _dio;
  WebinarsApi(this._dio);

  Future<Map<String, dynamic>> discover(Map<String, dynamic> filters) async {
    final r = await _dio.get('/api/v1/webinars/discover', queryParameters: filters);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> detail(String id) async {
    final r = await _dio.get('/api/v1/webinars/$id');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> liveRoom(String id) async {
    final r = await _dio.get('/api/v1/webinars/$id/live');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<List<dynamic>> chat(String id) async {
    final r = await _dio.get('/api/v1/webinars/$id/chat');
    return List<dynamic>.from(r.data as List);
  }

  Future<Map<String, dynamic>> postChat(String id, String text) async {
    final r = await _dio.post('/api/v1/webinars/$id/chat', data: {'text': text});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> register(String id) async {
    final r = await _dio.post('/api/v1/webinars/$id/register', data: {});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> createPurchase(String webinarId, {int quantity = 1}) async {
    final r = await _dio.post('/api/v1/webinars/purchases',
        data: {'webinarId': webinarId, 'quantity': quantity});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> confirmPurchase(String id, Map<String, dynamic> body) async {
    final r = await _dio.post('/api/v1/webinars/purchases/$id/confirm', data: body);
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> donate(String id, Map<String, dynamic> body) async {
    final r = await _dio.post('/api/v1/webinars/$id/donate', data: body);
    return Map<String, dynamic>.from(r.data as Map);
  }
}
