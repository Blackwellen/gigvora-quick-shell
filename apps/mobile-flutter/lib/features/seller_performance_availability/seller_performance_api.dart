import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

class SellerPerformanceApi {
  SellerPerformanceApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> overview(String sellerId) async {
    final r = await _dio.get('/seller-performance/$sellerId/overview');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<void> updateAvailability(String sellerId, Map<String, dynamic> patch) async {
    await _dio.put('/seller-performance/$sellerId/availability', data: patch);
  }

  Future<void> scheduleVacation(String sellerId, String start, String end, String? msg) async {
    await _dio.post('/seller-performance/$sellerId/vacation', data: {
      'start': start, 'end': end, if (msg != null) 'message': msg,
    });
  }

  Future<void> pauseAll(String sellerId) async {
    await _dio.post('/seller-performance/$sellerId/pause-all');
  }

  Future<void> setGigStatus(String sellerId, String gigId, String status, {String? reason}) async {
    await _dio.put('/seller-performance/$sellerId/gigs/$gigId/capacity', data: {
      'status': status, if (reason != null) 'pausedReason': reason,
    });
  }

  Future<void> actOnOptimization(String sellerId, String id, String action) async {
    await _dio.post('/seller-performance/$sellerId/optimizations/$id', data: {'action': action});
  }
}

final sellerPerformanceApiProvider = Provider<SellerPerformanceApi>((ref) {
  return SellerPerformanceApi(ref.watch(apiClientProvider));
});
