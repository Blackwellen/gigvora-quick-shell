import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'groups_api.dart';

/// Domain 14 — Riverpod providers for groups screens.
/// Reuses `groupsApiProvider` declared in groups_api.dart.

final groupsListProvider = FutureProvider.family<List<Map<String, dynamic>>, String?>((ref, q) async {
  final api = ref.watch(groupsApiProvider);
  final res = await api.list(q: q);
  return res.items;
});

final groupDetailProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, idOrSlug) async {
  final api = ref.watch(groupsApiProvider);
  return await api.detail(idOrSlug);
});

final groupMembersProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, id) async {
  final api = ref.watch(groupsApiProvider);
  final res = await api.members(id);
  return res.items;
});

final groupPostsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, id) async {
  final api = ref.watch(groupsApiProvider);
  final res = await api.posts(id);
  return res.items;
});
