// Riverpod providers for Domain 41 — Gigs Browse.
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'gigs_browse_api.dart';

class GigsBrowseQuery {
  const GigsBrowseQuery({
    this.q,
    this.category,
    this.sort = 'relevance',
    this.page = 1,
    this.pageSize = 24,
    this.proSellerOnly,
    this.fastDeliveryOnly,
    this.priceMin,
    this.priceMax,
  });
  final String? q;
  final String? category;
  final String sort;
  final int page;
  final int pageSize;
  final bool? proSellerOnly;
  final bool? fastDeliveryOnly;
  final int? priceMin;
  final int? priceMax;

  @override
  bool operator ==(Object other) =>
      other is GigsBrowseQuery &&
      other.q == q &&
      other.category == category &&
      other.sort == sort &&
      other.page == page &&
      other.pageSize == pageSize &&
      other.proSellerOnly == proSellerOnly &&
      other.fastDeliveryOnly == fastDeliveryOnly &&
      other.priceMin == priceMin &&
      other.priceMax == priceMax;

  @override
  int get hashCode => Object.hash(q, category, sort, page, pageSize, proSellerOnly, fastDeliveryOnly, priceMin, priceMax);
}

final gigsBrowseSearchProvider =
    FutureProvider.family<Map<String, dynamic>, GigsBrowseQuery>((ref, q) async {
  return ref.watch(gigsBrowseApiProvider).search(
        q: q.q,
        category: q.category,
        sort: q.sort,
        page: q.page,
        pageSize: q.pageSize,
        proSellerOnly: q.proSellerOnly,
        fastDeliveryOnly: q.fastDeliveryOnly,
        priceMin: q.priceMin,
        priceMax: q.priceMax,
      );
});

final gigsBrowseDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
  return ref.watch(gigsBrowseApiProvider).detail(id);
});

final gigsBrowseInsightsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.watch(gigsBrowseApiProvider).insights();
});

final gigsBrowseSavedSearchesProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.watch(gigsBrowseApiProvider).savedSearches();
});

final gigsBrowseBookmarksProvider = FutureProvider<List<String>>((ref) async {
  return ref.watch(gigsBrowseApiProvider).bookmarkIds();
});

class GigsBrowseMutations {
  GigsBrowseMutations(this.ref);
  final Ref ref;

  Future<bool> toggleBookmark(String gigId) async {
    final res = await ref.read(gigsBrowseApiProvider).toggleBookmark(gigId);
    ref.invalidate(gigsBrowseBookmarksProvider);
    return res;
  }

  Future<void> saveSearch(Map<String, dynamic> body) async {
    await ref.read(gigsBrowseApiProvider).upsertSavedSearch(body);
    ref.invalidate(gigsBrowseSavedSearchesProvider);
  }

  Future<void> removeSavedSearch(String id) async {
    await ref.read(gigsBrowseApiProvider).removeSavedSearch(id);
    ref.invalidate(gigsBrowseSavedSearchesProvider);
  }
}

final gigsBrowseMutationsProvider = Provider<GigsBrowseMutations>((ref) => GigsBrowseMutations(ref));
