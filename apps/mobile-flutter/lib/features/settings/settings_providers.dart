import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'settings_api.dart';

final settingsListProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(settingsApiProvider).list();
});

final connectionsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(settingsApiProvider).connections();
});

final dataRequestsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(settingsApiProvider).dataRequests();
});

final localesCatalogueProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(settingsApiProvider).locales();
});

final timezonesCatalogueProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(settingsApiProvider).timezones();
});
