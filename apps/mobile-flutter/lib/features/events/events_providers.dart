import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'events_api.dart';

/// Domain 15 — Riverpod providers for events screens.
/// Reuses `eventsApiProvider` declared in events_api.dart.

final eventsListProvider = FutureProvider.family<List<Map<String, dynamic>>, String?>((ref, q) async {
  final api = ref.watch(eventsApiProvider);
  final res = await api.list(q: q);
  return res.items;
});

final eventDetailProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, idOrSlug) async {
  final api = ref.watch(eventsApiProvider);
  return await api.detail(idOrSlug);
});

final eventSessionsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, id) async {
  final api = ref.watch(eventsApiProvider);
  final res = await api.sessions(id);
  return res.items;
});

final eventMessagesProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, id) async {
  final api = ref.watch(eventsApiProvider);
  final res = await api.messages(id);
  return res.items;
});
