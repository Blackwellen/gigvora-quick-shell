import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

/// Domain 10 — Network Graph, Connections, Followers, Degree Logic.
class NetworkApi {
  NetworkApi(this._dio);
  final Dio _dio;

  // ---------- requests ----------
  Future<Map<String, dynamic>> sendRequest(String recipientId, { String? message, String? idempotencyKey }) async {
    final r = await _dio.post(
      '/api/v1/network/requests',
      data: { 'recipientId': recipientId, if (message != null) 'message': message },
      options: idempotencyKey != null ? Options(headers: { 'Idempotency-Key': idempotencyKey }) : null,
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<NetworkPage> incoming({ String status = 'pending', int limit = 20 }) =>
      _list('/api/v1/network/requests/incoming', { 'status': status, 'limit': limit });
  Future<NetworkPage> outgoing({ String status = 'pending', int limit = 20 }) =>
      _list('/api/v1/network/requests/outgoing', { 'status': status, 'limit': limit });
  Future<NetworkPage> connections({ int limit = 100 }) =>
      _list('/api/v1/network/connections', { 'limit': limit });
  Future<NetworkPage> suggestions({ int limit = 12, int maxDegree = 2 }) =>
      _list('/api/v1/network/suggestions', { 'limit': limit, 'maxDegree': maxDegree });

  Future<NetworkPage> _list(String path, Map<String, dynamic> qp) async {
    final r = await _dio.get(path, queryParameters: qp);
    final data = r.data;
    if (data is List) {
      return NetworkPage(items: data.map((e) => Map<String, dynamic>.from(e as Map)).toList(), hasMore: false);
    }
    final m = Map<String, dynamic>.from(data as Map);
    return NetworkPage(
      items: (m['items'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList(),
      hasMore: m['hasMore'] == true,
    );
  }

  Future<Map<String, dynamic>> respond(String id, String decision) async {
    final r = await _dio.post('/api/v1/network/requests/$id/respond', data: { 'decision': decision });
    return Map<String, dynamic>.from(r.data as Map);
  }
  Future<void> withdraw(String id) async { await _dio.delete('/api/v1/network/requests/$id'); }

  Future<int> count() async {
    final r = await _dio.get('/api/v1/network/connections/count');
    return ((r.data as Map)['count'] ?? 0) as int;
  }
  Future<bool> remove(String id) async {
    final r = await _dio.delete('/api/v1/network/connections/$id');
    return ((r.data as Map)['removed'] ?? false) as bool;
  }

  Future<Map<String, dynamic>> degree(String id) async {
    final r = await _dio.get('/api/v1/network/degree/$id');
    return Map<String, dynamic>.from(r.data as Map);
  }
  Future<List<Map<String, dynamic>>> mutuals(String id, { int limit = 20 }) async {
    final r = await _dio.get('/api/v1/network/mutuals/$id', queryParameters: { 'limit': limit });
    return (r.data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<void> block(String id, { String? reason }) async {
    await _dio.post('/api/v1/network/blocks/$id', data: { if (reason != null) 'reason': reason });
  }
  Future<void> unblock(String id) async { await _dio.delete('/api/v1/network/blocks/$id'); }
  Future<List<Map<String, dynamic>>> blocks() async {
    final r = await _dio.get('/api/v1/network/blocks');
    return (r.data as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }
}

class NetworkPage {
  final List<Map<String, dynamic>> items;
  final bool hasMore;
  const NetworkPage({ required this.items, required this.hasMore });
}

final networkApiProvider = Provider<NetworkApi>((ref) => NetworkApi(ref.read(apiClientProvider)));
