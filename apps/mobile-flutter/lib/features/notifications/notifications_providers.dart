import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'notifications_api.dart';

final notificationsListProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(notificationsApiProvider).list();
});

final unreadCountProvider = FutureProvider.autoDispose<int>((ref) async {
  return ref.read(notificationsApiProvider).unreadCount();
});

final notificationPrefsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(notificationsApiProvider).preferences();
});

final notificationBadgesProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(notificationsApiProvider).badges();
});

final notificationDevicesProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(notificationsApiProvider).devices();
});
