/// Group 5 — OfflineCache TTL contract tests.
///
/// Covers the entire decision tree of [OfflineCache.readOrFetch]:
///   • fresh cache hit → no fetch
///   • TTL expiry → fetch + write
///   • fetch failure with no cache → rethrow
///   • fetch failure with stale cache → return stale
///   • clear() wipes only gigvora.cache.* keys, leaving other prefs intact
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:gigvora_mobile/core/offline_cache.dart';

void main() {
  late OfflineCache cache;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    cache = OfflineCache();
  });

  test('readOrFetch returns fresh cache without calling fetch', () async {
    await cache.write('feed', {'items': [1, 2]});
    var called = 0;
    final r = await cache.readOrFetch('feed',
        ttl: const Duration(minutes: 1),
        fetch: () async {
          called++;
          return {'items': [9, 9]};
        });
    expect(r['items'], [1, 2]);
    expect(called, 0);
  });

  test('readOrFetch refetches and writes when cache is stale', () async {
    await cache.write('feed', {'items': [1]});
    // Simulate TTL of zero: anything older than now is stale.
    final r = await cache.readOrFetch('feed',
        ttl: Duration.zero,
        fetch: () async => {'items': [2]});
    expect(r['items'], [2]);

    // The new value is now in cache.
    final hit = await cache.read('feed', ttl: const Duration(minutes: 1));
    expect(hit?['items'], [2]);
  });

  test('readOrFetch returns stale cache when fetch fails', () async {
    await cache.write('feed', {'items': ['stale']});
    final r = await cache.readOrFetch('feed',
        ttl: Duration.zero,
        fetch: () async => throw Exception('offline'));
    expect(r['items'], ['stale']);
  });

  test('readOrFetch rethrows when fetch fails and no cache exists', () async {
    expect(
      () => cache.readOrFetch('absent',
          ttl: const Duration(minutes: 1),
          fetch: () async => throw Exception('offline')),
      throwsException,
    );
  });

  test('clear wipes only namespaced keys', () async {
    final p = await SharedPreferences.getInstance();
    await p.setString('not.gigvora.cache.foo', 'keepme');
    await cache.write('a', {'x': 1});
    await cache.write('b', {'y': 2});

    await cache.clear();

    expect(await cache.read('a', ttl: const Duration(minutes: 1)), isNull);
    expect(await cache.read('b', ttl: const Duration(minutes: 1)), isNull);
    expect(p.getString('not.gigvora.cache.foo'), 'keepme');
  });
}
