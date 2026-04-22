import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/storage.dart';
import 'identity_api.dart';

/// Holds the active session token + identity. Persisted via Storage.
class AuthState {
  final String? accessToken;
  final String? refreshToken;
  final Map<String, dynamic>? identity;
  final bool mfaRequired;
  const AuthState({this.accessToken, this.refreshToken, this.identity, this.mfaRequired = false});
  bool get isAuthenticated => accessToken != null && !mfaRequired;
  AuthState copyWith({String? accessToken, String? refreshToken, Map<String, dynamic>? identity, bool? mfaRequired}) =>
      AuthState(
        accessToken: accessToken ?? this.accessToken,
        refreshToken: refreshToken ?? this.refreshToken,
        identity: identity ?? this.identity,
        mfaRequired: mfaRequired ?? this.mfaRequired,
      );
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._api, this._storage) : super(const AuthState());
  final IdentityApi _api;
  final Storage _storage;

  Future<void> bootstrap() async {
    final t = await _storage.getToken();
    if (t != null) state = state.copyWith(accessToken: t);
  }

  Future<void> signup({required String email, required String password, String? displayName}) async {
    final r = await _api.signup(
      email: email,
      password: password,
      displayName: displayName,
      idempotencyKey: 'signup-${DateTime.now().millisecondsSinceEpoch}-$email',
    );
    await _persist(r);
  }

  Future<bool> login({required String email, required String password, String? mfaCode}) async {
    final r = await _api.login(email: email, password: password, mfaCode: mfaCode);
    if (r['mfaRequired'] == true) {
      state = state.copyWith(mfaRequired: true);
      return false;
    }
    await _persist(r);
    return true;
  }

  Future<void> _persist(Map<String, dynamic> r) async {
    final access = r['accessToken'] as String?;
    final refresh = r['refreshToken'] as String?;
    if (access != null) await _storage.setToken(access);
    state = AuthState(
      accessToken: access,
      refreshToken: refresh,
      identity: r['identity'] is Map ? Map<String, dynamic>.from(r['identity'] as Map) : null,
      mfaRequired: false,
    );
  }

  Future<void> logout() async {
    final rt = state.refreshToken;
    if (rt != null) {
      try { await _api.logout(rt); } catch (_) {}
    }
    await _storage.setToken(null);
    state = const AuthState();
  }
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref.read(identityApiProvider), ref.read(storageProvider));
});

final sessionsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(identityApiProvider).listSessions();
});

final mfaFactorsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(identityApiProvider).listMfa();
});
