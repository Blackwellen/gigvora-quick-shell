# Gigvora Mobile (Flutter)

Flutter companion app for the Gigvora platform. Reduced-but-complete parity
with the web shell: feed, work, inbox, profile, plus role/org switching and
a shell-bootstrap call against the NestJS API at `/api/v1/shell/bootstrap`.

## Run

```bash
cd apps/mobile-flutter
flutter pub get
flutter run --dart-define=GIGVORA_API_URL=http://10.0.2.2:3000
```

## Structure

```
lib/
  main.dart                 # entrypoint + ProviderScope
  app/router.dart           # go_router config
  core/api_client.dart      # Dio + bearer auth
  core/storage.dart         # token + active org
  features/
    shell/                  # bootstrap, org switcher, role switcher
    feed/                   # tab 0
    work/                   # tab 1
    inbox/                  # tab 2
    profile/                # tab 3
```

## Parity matrix vs web shell

| Surface           | Web                        | Flutter                                    |
|-------------------|----------------------------|--------------------------------------------|
| Top bar           | LoggedInTopBar (mega menu) | AppBar + drawer (mega menu → bottom sheet) |
| Sidebar           | Collapsible left rail      | Bottom nav (4 tabs)                        |
| Right rail        | SavedViews / Recents       | Drawer + per-screen sticky bar             |
| Org switcher      | TopBar dropdown            | Modal bottom sheet                         |
| Role switcher     | RoleContext dropdown       | Profile screen segmented control           |
| Saved views       | Inline list                | Drawer section                             |
| Recents           | Right rail                 | Pull-down sheet on Feed tab                |
| Command palette   | ⌘K                         | Search action in AppBar → full-screen sheet|
