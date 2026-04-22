// Riverpod providers for Domain 12 — Companies.
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'companies_api.dart';

class CompanyListQuery {
  final String? q; final String? industry;
  CompanyListQuery({this.q, this.industry});
  @override bool operator ==(Object o) => o is CompanyListQuery && o.q == q && o.industry == industry;
  @override int get hashCode => Object.hash(q, industry);
}

final companyListProvider =
    FutureProvider.family<CompaniesPage, CompanyListQuery>((ref, qq) async {
  return ref.watch(companiesApiProvider).list(q: qq.q, industry: qq.industry);
});

final companyDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, idOrSlug) async {
  return ref.watch(companiesApiProvider).detail(idOrSlug);
});

final companyPostsProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((ref, id) async {
  return ref.watch(companiesApiProvider).posts(id);
});

final companyMembersProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((ref, id) async {
  return ref.watch(companiesApiProvider).members(id);
});

class CompanyMutations {
  CompanyMutations(this.ref);
  final Ref ref;
  String _key(String p) => '$p-${DateTime.now().microsecondsSinceEpoch}';

  Future<void> follow(String id) async {
    await ref.read(companiesApiProvider).follow(id);
    ref.invalidate(companyDetailProvider(id));
  }
  Future<void> unfollow(String id) async {
    await ref.read(companiesApiProvider).unfollow(id);
    ref.invalidate(companyDetailProvider(id));
  }
  Future<void> update(String id, Map<String, dynamic> patch) async {
    await ref.read(companiesApiProvider).update(id, patch, idempotencyKey: _key('co-upd'));
    ref.invalidate(companyDetailProvider(id));
  }
  Future<void> addPost(String id, String body) async {
    await ref.read(companiesApiProvider).addPost(id, body, idempotencyKey: _key('co-post'));
    ref.invalidate(companyPostsProvider(id));
    ref.invalidate(companyDetailProvider(id));
  }
  Future<void> invite(String id, Map<String, dynamic> body) async {
    await ref.read(companiesApiProvider).invite(id, body, idempotencyKey: _key('co-invite'));
    ref.invalidate(companyMembersProvider(id));
    ref.invalidate(companyDetailProvider(id));
  }
  Future<void> setRole(String id, String identityId, String role) async {
    await ref.read(companiesApiProvider).setRole(id, identityId, role);
    ref.invalidate(companyMembersProvider(id));
  }
  Future<void> removeMember(String id, String identityId) async {
    await ref.read(companiesApiProvider).removeMember(id, identityId);
    ref.invalidate(companyMembersProvider(id));
    ref.invalidate(companyDetailProvider(id));
  }
  Future<void> setBrand(String id, Map<String, dynamic> b) async {
    await ref.read(companiesApiProvider).setBrand(id, b, idempotencyKey: _key('co-brand'));
    ref.invalidate(companyDetailProvider(id));
  }
}

final companyMutationsProvider = Provider<CompanyMutations>((ref) => CompanyMutations(ref));
