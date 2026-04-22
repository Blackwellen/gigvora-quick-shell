import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'marketing_api.dart';

class MarketingPagesArgs {
  final String? surface;
  final String? status;
  final String? q;
  const MarketingPagesArgs({this.surface, this.status, this.q});
  @override
  bool operator ==(Object o) =>
      o is MarketingPagesArgs && o.surface == surface && o.status == status && o.q == q;
  @override
  int get hashCode => Object.hash(surface, status, q);
}

final marketingPagesProvider = FutureProvider.family
    .autoDispose<Map<String, dynamic>, MarketingPagesArgs>((ref, args) async {
  final api = ref.read(marketingApiProvider);
  return api.listPages(surface: args.surface, status: args.status, q: args.q);
});

final marketingPageProvider =
    FutureProvider.family.autoDispose<Map<String, dynamic>, String>((ref, slug) async {
  final api = ref.read(marketingApiProvider);
  return api.getPage(slug);
});

final marketingLeadsProvider = FutureProvider.family
    .autoDispose<Map<String, dynamic>, String?>((ref, status) async {
  final api = ref.read(marketingApiProvider);
  return api.listLeads(status: status);
});

final ctaExperimentProvider =
    FutureProvider.family.autoDispose<Map<String, dynamic>, String>((ref, key) async {
  final api = ref.read(marketingApiProvider);
  return api.getExperiment(key);
});
