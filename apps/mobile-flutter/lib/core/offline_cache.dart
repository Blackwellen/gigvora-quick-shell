/// Group 5 — Offline cache primitive.
///
/// TTL-aware key/value cache backed by `shared_preferences`. Each domain
/// repository (companies, feed, network, …) wraps its remote fetch with
/// [OfflineCache.readOrFetch] so the app stays usable on flaky connections
/// and cold-starts faster.
///
/// Contract:
///   • `read(key)` returns the cached payload if present and within TTL.
///   • `write(key, payload)` stores a JSON-encodable payload + timestamp.
///   • `readOrFetch(key, ttl, fetch)` is the canonical high-level API:
///       1. Return fresh cache if within TTL.
///       2. Otherwise call `fetch()`, persist its result, and return it.
///       3. If `fetch()` throws AND a stale cache exists, return the stale
///          cache rather than propagate the error (best-effort offline).
///
/// Designed for small payloads (lists of IDs, summary objects). Not a
/// replacement for a full sqflite/hive store.
library offline_cache;

import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineCache {
  static const _prefix = 'gigvora.cache.';

  /// Read a cached entry. Returns null when absent or stale.
  Future<Map<String, dynamic>?> read(String key, {required Duration ttl}) async {
    final raw = await _raw(key);
    if (raw == null) return null;
    final ts = DateTime.tryParse(raw['ts'] as String? ?? '');
    if (ts == null) return null;
    if (DateTime.now().difference(ts) > ttl) return null;
    return raw['payload'] as Map<String, dynamic>?;
  }

  /// Persist a payload + current timestamp.
  Future<void> write(String key, Map<String, dynamic> payload) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(
      _prefix + key,
      jsonEncode({'ts': DateTime.now().toIso8601String(), 'payload': payload}),
    );
  }

  /// Best-effort offline read-through:
  ///   • fresh cache → return it (no network)
  ///   • stale cache + fetch fails → return stale cache
  ///   • stale cache + fetch succeeds → write & return fresh
  Future<Map<String, dynamic>> readOrFetch(
    String key, {
    required Duration ttl,
    required Future<Map<String, dynamic>> Function() fetch,
  }) async {
    final fresh = await read(key, ttl: ttl);
    if (fresh != null) return fresh;
    try {
      final live = await fetch();
      await write(key, live);
      return live;
    } catch (e) {
      final stale = await _staleFallback(key);
      if (stale != null) return stale;
      rethrow;
    }
  }

  /// Wipe a single key.
  Future<void> invalidate(String key) async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_prefix + key);
  }

  /// Wipe everything (logout, account switch).
  Future<void> clear() async {
    final p = await SharedPreferences.getInstance();
    final keys = p.getKeys().where((k) => k.startsWith(_prefix)).toList();
    for (final k in keys) {
      await p.remove(k);
    }
  }

  Future<Map<String, dynamic>?> _raw(String key) async {
    final p = await SharedPreferences.getInstance();
    final s = p.getString(_prefix + key);
    if (s == null) return null;
    try {
      return jsonDecode(s) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> _staleFallback(String key) async {
    final raw = await _raw(key);
    return raw?['payload'] as Map<String, dynamic>?;
  }
}

final offlineCacheProvider = Provider<OfflineCache>((_) => OfflineCache());
