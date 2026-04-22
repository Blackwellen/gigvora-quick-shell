import 'package:dio/dio.dart';

/// Domain 62 — Flutter client for Map Views, Geo Intel & Place-Based Media.
class MapViewsGeoIntelApi {
  MapViewsGeoIntelApi(this._dio);
  final Dio _dio;
  static const _base = '/api/v1/map-views-geo-intel';

  Future<Map<String, dynamic>> overview() async =>
      Map<String, dynamic>.from((await _dio.get('$_base/overview')).data as Map);

  Future<List<dynamic>> places({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/places',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<Map<String, dynamic>> createPlace(Map<String, dynamic> body) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/places', data: body)).data as Map);

  Future<List<dynamic>> geofences({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/geofences',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<Map<String, dynamic>> testGeofence(String id, double lat, double lng) async =>
      Map<String, dynamic>.from((await _dio.post('$_base/geofences/$id/test',
          data: {'lat': lat, 'lng': lng})).data as Map);

  Future<List<dynamic>> audiences({String? status}) async =>
      List<dynamic>.from((await _dio.get('$_base/audiences',
          queryParameters: {if (status != null) 'status': status})).data as List);

  Future<List<dynamic>> placeMedia(String placeId) async =>
      List<dynamic>.from((await _dio.get('$_base/places/$placeId/media')).data as List);

  Future<void> ingestSignal(Map<String, dynamic> body) async {
    await _dio.post('$_base/signals', data: body);
  }

  Future<Map<String, dynamic>> heatmap({int resolution = 7}) async =>
      Map<String, dynamic>.from((await _dio.get('$_base/heatmap',
          queryParameters: {'resolution': resolution})).data as Map);
}
