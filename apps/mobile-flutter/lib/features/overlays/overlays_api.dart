import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

/// Domain 06 — Pop-ups, Drawers, Follow-Through Windows, Detached Views.
class OverlaysApi {
  OverlaysApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> open({
    required String kind, required String surfaceKey,
    String? route, String? entityType, String? entityId,
    Map<String, dynamic>? payload, String origin = 'user', String? idempotencyKey,
  }) async {
    final r = await _dio.post('/api/v1/overlays',
      data: {
        'kind': kind, 'surfaceKey': surfaceKey,
        if (route != null) 'route': route,
        if (entityType != null) 'entityType': entityType,
        if (entityId != null) 'entityId': entityId,
        if (payload != null) 'payload': payload,
        'origin': origin,
      },
      options: idempotencyKey == null ? null : Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> patch(String id, {
    Map<String, dynamic>? payload, String? status, Map<String, dynamic>? result,
  }) async {
    final r = await _dio.patch('/api/v1/overlays/$id', data: {
      if (payload != null) 'payload': payload,
      if (status != null) 'status': status,
      if (result != null) 'result': result,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> listOpen() async {
    final r = await _dio.get('/api/v1/overlays');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> startWorkflow(String templateKey,
      {Map<String, dynamic>? context, String? idempotencyKey}) async {
    final r = await _dio.post('/api/v1/overlays/workflows',
      data: {
        'templateKey': templateKey,
        if (context != null) 'context': context,
      },
      options: idempotencyKey == null ? null : Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> advanceWorkflow(String id, String stepKey,
      {Map<String, dynamic>? data, String? status}) async {
    final r = await _dio.post('/api/v1/overlays/workflows/$id/advance', data: {
      'stepKey': stepKey,
      if (data != null) 'data': data,
      if (status != null) 'status': status,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> getWorkflow(String id) async {
    final r = await _dio.get('/api/v1/overlays/workflows/$id');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> listWorkflows() async {
    final r = await _dio.get('/api/v1/overlays/workflows');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> detachWindow({
    required String channelKey, required String surfaceKey, required String route,
    Map<String, dynamic>? state,
  }) async {
    final r = await _dio.post('/api/v1/overlays/windows', data: {
      'channelKey': channelKey, 'surfaceKey': surfaceKey, 'route': route,
      if (state != null) 'state': state,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> pingWindow(String channelKey, {Map<String, dynamic>? state}) =>
      _dio.post('/api/v1/overlays/windows/$channelKey/ping', data: {if (state != null) 'state': state});

  Future<void> closeWindow(String channelKey) =>
      _dio.delete('/api/v1/overlays/windows/$channelKey');

  Future<Map<String, dynamic>> listWindows() async {
    final r = await _dio.get('/api/v1/overlays/windows');
    return Map<String, dynamic>.from(r.data as Map);
  }
}

final overlaysApiProvider = Provider<OverlaysApi>((ref) => OverlaysApi(ref.read(apiClientProvider)));
