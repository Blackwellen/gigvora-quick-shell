### D26 — Web/Mobile Parity, Flutter Completion, Firebase, Splash, Push, Native Security — Run 1 Audit

Date: 2026-04-18 · Group: G7 (D26/4) · Status: Run 1 (Audit) complete.

## Inventory

### Flutter app `apps/mobile-flutter`
- ✅ pubspec: `gigvora_mobile v0.1.0+1`, Dart 3.4+, deps: `go_router 14, flutter_riverpod 2.5, dio 5.5, shared_preferences 2.2, intl 0.19, cupertino_icons 1.0`.
- ✅ `lib/` structure: `app/`, `core/`, `features/`, `main.dart`. **78 feature folders** (ads_*, agency, auth_v2, billing, booking, calendar, calls, client_dashboard, companies, contracts, contracts_sow_acceptance, customer_service, dispute_ops, donations, enterprise_*, events, feed, finance_admin, gigs_browse, groups, identity*, inbox, integrations, internal_admin_*, interview_planning, job_*, jobs_browse, launchpad, map_views, marketing, media, moderator, network, notifications, org_members, overlays*, payouts, podcasts, pricing, profiles, project_*, proposal_*, recruiter_dashboard, plus 4 `backfill_batch_*`).
- ✅ Router: `apps/mobile-flutter/lib/app/router.dart` — large GoRouter with 100+ routes for feed/profile/companies/calendar/bookings/calls/marketing/auth/billing/search/overlays/notifications/settings/groups/events/contracts/hire/inbox/integrations/webhooks/identity/entitlements + 4 backfill batches.
- ✅ Core utilities exist: `api_client.dart`, `async_state.dart`, `offline_cache.dart`, `storage.dart`.

## Critical findings

### 🚨 P0
1. **No Firebase / FCM / push integration** — `grep firebase|fcm|onesignal|apns` returns zero in pubspec and code. No `firebase_core`, `firebase_messaging`, `firebase_analytics`, `firebase_crashlytics`. Push notifications, crash reporting, and analytics — entire native observability stack — are absent.
2. **No native `android/` or `ios/` folders** — `ls apps/mobile-flutter/android` and `ls apps/mobile-flutter/ios` return empty. The Flutter app **cannot be built or shipped** to either store. No `AndroidManifest.xml`, no `Info.plist`, no signing config, no icons, no splash assets.
3. **No splash screen** — no `flutter_native_splash` dep, no logo asset wiring, no launch screen storyboard. Cold-start shows blank white.
4. **No app icons** — no `flutter_launcher_icons` dep; no asset pipeline.
5. **No socket / realtime client** — `grep socket_io|web_socket` returns zero. Mobile cannot receive notifications, presence, typing, live counters, or any of the D24 realtime fabric. **Every screen polls.**
6. **No auth integration** — `grep supabase|auth` in `lib/` returns nothing meaningful. `auth_v2/auth_screens.dart` exists as UI shell but has no Supabase client, no token storage in secure keychain (uses plain `shared_preferences`), no MFA enforcement, no biometric unlock.
7. **No web-mobile parity matrix** — Web has 200+ pages across 50+ NestJS modules; mobile claims 78 features but most are likely shell-only screens (the 4 `backfill_batch_*` folders are a tell — auto-generated stubs). No documented parity ledger declaring which features are full / partial / read-only / missing on mobile.
8. **`shared_preferences` for tokens** — auth/session state stored in plain prefs (not `flutter_secure_storage` / Keychain / Keystore). On a rooted/jailbroken device tokens are exfiltrable. **Native security failure.**
9. **No reels-first bottom nav** — legacy coverage explicitly requires reels-first mobile navigation (memory: media-ecosystem); router has no `BottomNavigationBar` declaration with reels as primary tab.
10. **No mock-data eradication on mobile** — same demo-data risk as web; not yet audited per-feature, but pattern likely repeats.

### P1
11. No `dio` interceptor for auth token refresh / 401 retry / network logging.
12. No offline queue for mutations (`offline_cache.dart` exists but is read-only).
13. No deep-link handler / universal links / app-link verification.
14. No `flutter_local_notifications` for in-app notification rendering when app is foregrounded.
15. No biometric auth (`local_auth`) for sensitive surfaces (payouts, admin, KYC).
16. No certificate pinning on `dio` HTTP client.
17. No App Tracking Transparency (iOS) prompt; no Android 13+ POST_NOTIFICATIONS runtime permission flow.
18. No GDPR consent banner on first launch (legal requirement for EU stores).
19. No privacy manifest (`PrivacyInfo.xcprivacy`) — required by Apple for App Store submission since May 2024.
20. No background fetch / WorkManager for periodic sync.
21. No video player for reels/feed/podcasts/webinars (no `video_player` / `chewie` / `better_player` dep).
22. No image caching (`cached_network_image`).
23. No analytics events instrumented anywhere.
24. No crash reporting → Sentry/Firebase Crashlytics.
25. No CI for `flutter analyze`, `flutter test`, build of debug APK / IPA.

### P2
26. No `riverpod` code generation (`riverpod_generator`); providers are hand-written.
27. No theme/dark-mode contract bound to web design tokens.
28. No accessibility audit (semantic labels, dynamic type, contrast).
29. No internationalization scaffold beyond `intl` import (no ARB files, no `flutter_localizations`).
30. No widget golden tests.
31. No play store / app store metadata kit (screenshots, descriptions, ASO).

## Run 2 build priorities
1. **Generate native shells** — `flutter create . --platforms=android,ios --org com.gigvora` (preserves `lib/`); add Bundle IDs, app icons (`flutter_launcher_icons`), splash (`flutter_native_splash`), signing config, ProGuard rules.
2. **Firebase setup** — `firebase_core`, `firebase_messaging`, `firebase_crashlytics`, `firebase_analytics`; FCM token registration → NestJS `push_subscriptions` table (D24 dependency). iOS APNs entitlement.
3. **Secure token storage** — replace `shared_preferences` for auth with `flutter_secure_storage`; biometric unlock via `local_auth` for sensitive surfaces.
4. **Realtime parity** — add `socket_io_client`; build `RealtimeProvider` parity with web (`useRealtimeChannel` / `useNotificationStream` / `usePresence` equivalents).
5. **Reels-first bottom nav** — `ShellWithBottomNav` wrapping GoRouter with 5 tabs: Reels (default) / Feed / Inbox / Hire-or-Hub / Profile.
6. **Auth integration** — Supabase JS via REST through `dio` (no Flutter Supabase SDK needed for REST); token refresh interceptor; MFA challenge flow; logout clears keychain + revokes FCM token.
7. **Eradicate demo data** — sweep `lib/features/**` for any local mock arrays; replace with real `*_api.dart` calls.
8. **Privacy manifest** (`PrivacyInfo.xcprivacy`), GDPR consent banner, ATT prompt (iOS), POST_NOTIFICATIONS (Android 13+).
9. **Players** — `video_player` + custom controls for reels/feed/podcasts/webinars; `cached_network_image` for thumbnails.
10. **Web-mobile parity ledger** — `docs/qa/D26-mobile-parity-ledger.md` declaring per-feature: full / partial / read-only / missing / N/A; targets >= 80% full or read-only at v1.
11. **CI** — GitHub Actions matrix for `flutter analyze`, `flutter test`, debug APK build, iOS simulator build.
12. **Playwright + integration tests** — Patrol or `integration_test` package: cold start → splash → auth → bottom nav → reels playback → notification arrival (FCM) → biometric unlock for payouts.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.
