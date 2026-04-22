import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class Storage {
  static const _kToken = 'gigvora.token';
  static const _kOrg = 'gigvora.activeOrg';

  Future<String?> getToken() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_kToken);
  }

  Future<void> setToken(String? v) async {
    final p = await SharedPreferences.getInstance();
    if (v == null) { await p.remove(_kToken); } else { await p.setString(_kToken, v); }
  }

  Future<String?> getActiveOrg() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_kOrg);
  }

  Future<void> setActiveOrg(String id) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_kOrg, id);
  }
}

final storageProvider = Provider<Storage>((_) => Storage());
