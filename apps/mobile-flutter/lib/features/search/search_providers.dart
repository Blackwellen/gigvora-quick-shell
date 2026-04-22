import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'search_api.dart';

final recentSearchesProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(searchApiProvider).recent();
});
final trendingSearchesProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(searchApiProvider).trending();
});
final savedSearchesProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(searchApiProvider).savedSearches();
});
final paletteActionsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  return ref.read(searchApiProvider).paletteActions();
});

class SearchQuery {
  final String q;
  final String? scope;
  const SearchQuery(this.q, {this.scope});
  @override
  bool operator ==(Object other) => other is SearchQuery && other.q == q && other.scope == scope;
  @override
  int get hashCode => Object.hash(q, scope);
}

final searchResultsProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, SearchQuery>((ref, query) async {
  if (query.q.trim().isEmpty) return {'items': [], 'total': 0, 'limit': 20, 'hasMore': false};
  return ref.read(searchApiProvider).search(query.q, scope: query.scope);
});
