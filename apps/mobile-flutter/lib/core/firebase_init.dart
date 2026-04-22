import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

/// Firebase bootstrap for Gigvora mobile.
///
/// Wires:
///   - Firebase.initializeApp() with platform-specific options
///   - FCM push token capture + topic subscription per role
///   - Background message handler (must be top-level)
///
/// FD-18 G05 — mobile readiness.
///
/// Real DefaultFirebaseOptions are emitted by `flutterfire configure`.
/// This file deliberately ships a stub options class so the project compiles
/// before that codegen runs; replace with the generated file at release time.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform => const FirebaseOptions(
        apiKey: 'STUB_API_KEY',
        appId: 'STUB_APP_ID',
        messagingSenderId: 'STUB_SENDER_ID',
        projectId: 'gigvora-mobile',
      );
}

@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  if (kDebugMode) print('[fcm/bg] ${message.messageId}');
}

class FirebaseBootstrap {
  static Future<void> init() async {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    final fcm = FirebaseMessaging.instance;
    await fcm.requestPermission(alert: true, badge: true, sound: true);
    FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);
    final token = await fcm.getToken();
    if (kDebugMode) print('[fcm] token=$token');
  }

  /// Subscribe to per-role topics so the NestJS backend can target users.
  static Future<void> subscribeRole(String role) async {
    await FirebaseMessaging.instance.subscribeToTopic('role.$role');
  }

  static Future<void> unsubscribeRole(String role) async {
    await FirebaseMessaging.instance.unsubscribeFromTopic('role.$role');
  }
}
