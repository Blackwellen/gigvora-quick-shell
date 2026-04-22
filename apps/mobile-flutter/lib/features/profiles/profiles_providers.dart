// Riverpod providers for Domain 11 — Profiles.
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'profiles_api.dart';

final profileDetailProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
  return ref.watch(profilesApiProvider).getProfile(id);
});

final myVerificationsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.watch(profilesApiProvider).myVerifications();
});

final reputationProvider = FutureProvider.family<Map<String, dynamic>?, String>((ref, id) async {
  return ref.watch(profilesApiProvider).getReputation(id);
});

final badgesProvider = FutureProvider.family<List<dynamic>, String>((ref, id) async {
  return ref.watch(profilesApiProvider).getBadges(id);
});

class ProfileMutations {
  ProfileMutations(this.ref);
  final Ref ref;

  Future<void> updateMine(Map<String, dynamic> patch) async {
    await ref.read(profilesApiProvider).updateMine(patch, idempotencyKey: _key('upd'));
    ref.invalidate(profileDetailProvider);
  }

  Future<void> addSkill(String identityId, String skill, {String level = 'intermediate'}) async {
    await ref.read(profilesApiProvider).addSkill(skill, level: level, idempotencyKey: _key('skill-$skill'));
    ref.invalidate(profileDetailProvider(identityId));
  }

  Future<void> removeSkill(String identityId, String skillId) async {
    await ref.read(profilesApiProvider).removeSkill(skillId);
    ref.invalidate(profileDetailProvider(identityId));
  }

  Future<void> addExperience(String identityId, Map<String, dynamic> body) async {
    await ref.read(profilesApiProvider).addExperience(body, idempotencyKey: _key('exp'));
    ref.invalidate(profileDetailProvider(identityId));
  }

  Future<void> addEducation(String identityId, Map<String, dynamic> body) async {
    await ref.read(profilesApiProvider).addEducation(body, idempotencyKey: _key('edu'));
    ref.invalidate(profileDetailProvider(identityId));
  }

  Future<void> addPortfolio(String identityId, Map<String, dynamic> item) async {
    await ref.read(profilesApiProvider).addPortfolio(item, idempotencyKey: _key('port'));
    ref.invalidate(profileDetailProvider(identityId));
  }

  Future<void> removePortfolio(String identityId, String itemId) async {
    await ref.read(profilesApiProvider).removePortfolio(itemId);
    ref.invalidate(profileDetailProvider(identityId));
  }

  Future<void> requestVerification(String kind, {String? evidenceUrl}) async {
    await ref.read(profilesApiProvider).requestVerification(kind, evidenceUrl: evidenceUrl, idempotencyKey: _key('verif-$kind'));
    ref.invalidate(myVerificationsProvider);
  }

  String _key(String prefix) => '$prefix-${DateTime.now().microsecondsSinceEpoch}';
}

final profileMutationsProvider = Provider<ProfileMutations>((ref) => ProfileMutations(ref));
