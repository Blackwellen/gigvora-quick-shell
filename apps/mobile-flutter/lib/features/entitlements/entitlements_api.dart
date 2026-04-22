import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_client.dart';

/// Domain 04 — Roles, Entitlements, Plans & Access Gating (mobile parity).
///
/// Mobile UX rules:
///   • Role switcher renders as a bottom sheet from the avatar tap.
///   • Plan picker renders as a swipeable card carousel with sticky CTA.
///   • Upgrade gates render as inline frosted overlays with a "Continue on web"
///     deep link when the in-app purchase flow isn't yet enabled for that SKU.
class EntitlementsApi {
  EntitlementsApi(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> listPlans() async {
    final r = await _dio.get('/api/v1/entitlements/plans');
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> resolveMe({String? orgId}) async {
    final r = await _dio.get('/api/v1/entitlements/me',
      queryParameters: {if (orgId != null) 'orgId': orgId});
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> checkAccess({
    String? feature, String? requiredRole, String? orgId, String? route,
  }) async {
    final r = await _dio.post('/api/v1/entitlements/check', data: {
      if (feature != null) 'feature': feature,
      if (requiredRole != null) 'requiredRole': requiredRole,
      if (orgId != null) 'orgId': orgId,
      if (route != null) 'route': route,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> switchRole(String role, {String? orgId}) async {
    final r = await _dio.post('/api/v1/entitlements/roles/switch', data: {
      'role': role, if (orgId != null) 'orgId': orgId,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }

  Future<Map<String, dynamic>> changePlan(String subscriptionId, String toPlan, {String? reason}) async {
    final r = await _dio.post('/api/v1/entitlements/subscriptions/change', data: {
      'subscriptionId': subscriptionId, 'toPlan': toPlan,
      if (reason != null) 'reason': reason,
    });
    return Map<String, dynamic>.from(r.data as Map);
  }
}

final entitlementsApiProvider =
    Provider<EntitlementsApi>((ref) => EntitlementsApi(ref.read(apiClientProvider)));
