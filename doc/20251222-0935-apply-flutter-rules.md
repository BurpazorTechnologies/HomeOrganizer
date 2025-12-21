---
title: "Apply Flutter rules to home_organizer_flutter_app (Riverpod/go_router/Dio/freezed refactor)"
id: "20251222-0935-apply-flutter-rules"
status: approved
owner: "AI"
requires_approval: true
---

# 1) Summary / Goal
- Refactor `home_organizer_flutter_app` to conform to the Flutter workspace rules in `.cursor/rules/home_organizer_flutter_app/*.mdc`.
- This matters to ensure consistent architecture (feature-first + layers), predictable state/navigation, secure token handling, and maintainable growth.

# 2) MVP Scope (Do the minimum)
- In-scope:
  - Adopt the required “defaults” from the rules: **Riverpod**, **go_router**, **Dio**, **freezed + json_serializable**.
  - Restructure existing features (auth/login, dashboard/logout, version) into `presentation/ domain/ data/` with strict boundaries + barrel public APIs.
  - Implement repository pattern + typed failures + consistent UI-friendly error state.
  - Replace token persistence with **secure storage** and fix TLS/cert handling so **dev-only** shortcuts do not ship to prod.
  - Add i18n scaffolding (`intl` + ARB) and migrate user-facing strings for current screens.
  - Add basic tests (unit + widget) for key flows and error/loading states.
  - Make analyzer/lints align with the rules (no “lint off because annoying”).
- Out-of-scope (unless you explicitly request it in this plan):
  - Full crash-reporting vendor setup that requires credentials (Crashlytics/Sentry DSN/keys).
  - Offline DB layer (Hive/Isar/SQLite) and sync/conflict strategies (we can stub interfaces but not implement a full offline system yet).
  - A complete design system overhaul beyond minimal tokens + ThemeExtensions needed to remove hardcoded styles in current screens.

# 3) Assumptions & Constraints
- Flutter/Dart only; no backend/Laravel changes.
- We will add packages to `pubspec.yaml` only as required to meet the rules (listed below).
- We will keep changes minimal but the refactor will touch most of `lib/` because the current code is a scaffold that doesn’t match the rule stack.

# 4) Files to Change (strict allow-list)
- `home_organizer_flutter_app/pubspec.yaml` — add required packages (Riverpod/go_router/Dio/freezed/etc)
- `home_organizer_flutter_app/pubspec.lock` — lockfile will update when dependencies change
- `home_organizer_flutter_app/analysis_options.yaml` — align lints with rules
- `home_organizer_flutter_app/lib/` — refactor into layered feature-first architecture + routing/state/networking/logging
- `home_organizer_flutter_app/test/` — add unit/widget tests required by rules
- `home_organizer_flutter_app/l10n.yaml` — configure ARB workflow (if needed)
- `home_organizer_flutter_app/lib/l10n/` — ARB files / generated localization entrypoints (as configured)
- `home_organizer_flutter_app/.flutter-plugins-dependencies` — updated by Flutter when plugins change (e.g. secure storage)
- `home_organizer_flutter_app/.dart_tool/` — generated tooling output from `pub get` / build_runner / l10n
- `/.github/workflows/flutter.yml` — CI checks (format/analyze/test/build) **only if you confirm GitHub Actions is desired**
> Only files listed here may be edited in implementation.

# 5) Implementation Steps (ordered, checklist)
1. Update dependencies/dev_dependencies:
   - Add `flutter_riverpod`, `riverpod_annotation` (if using generators), `go_router`, `dio`
   - Add `freezed_annotation`, `json_annotation`; dev: `build_runner`, `freezed`, `json_serializable`
   - Add `flutter_secure_storage` for tokens
   - Add `intl` (+ l10n config)
   - Add a lightweight logger package (e.g. `logger`) or keep a thin wrapper if you prefer (decision in Open Questions)
2. Lints/analysis:
   - Remove “lint disabled” exceptions that contradict the rules (e.g. enable `avoid_print`)
   - Ensure formatting/analyzer pass (`dart format`, `flutter analyze`)
3. Project structure:
   - Introduce `lib/shared/` for cross-cutting helpers (logging, validators, failures, etc.)
   - For each feature: create `presentation/ domain/ data/` + `<feature>.dart` barrel file enforcing import boundaries
4. Networking (Dio):
   - Create a single Dio client provider configured from `AppConfig` (timeouts, baseUrl)
   - Add interceptors: auth token injection, requestId, safe logging (redacted), error mapping
5. Domain + failures:
   - Define domain `Failure` types (network/auth/validation/unexpected)
   - Ensure Dio/Platform exceptions do not leak into UI
6. Auth feature refactor:
   - Create `AuthRepository` (domain) + impl (data) using Dio API client
   - Create DTOs with `freezed` + `json_serializable`, map to domain entities
   - Create Riverpod controller/notifier using `AsyncValue` and UI-friendly state/messages
7. Token storage + security:
   - Replace token persistence with secure storage
   - Ensure logout clears sensitive data
   - Ensure TLS/cert shortcuts apply **only** for local/dev if explicitly allowed (no unconditional accept in prod)
8. Routing (go_router):
   - Centralize routes under `lib/app/router/`
   - Implement redirect guards (startup/auth) based on auth state provider (no per-screen gate logic)
   - Replace `MaterialApp(routes:)` with `MaterialApp.router`
9. Theming/design system (minimal):
   - Add minimal tokens + ThemeExtension(s) and remove hardcoded style usage in current screens where feasible
10. Forms/validation + a11y:
   - Extract validators to `shared/validators/` (or domain if business)
   - Add semantics/tooltip labels for icon-only buttons and ensure text scaling doesn’t clip
11. i18n:
   - Add ARB + generated localization setup and migrate current UI strings
12. Tests:
   - Unit tests for mappers/repository failure mapping
   - Widget tests for login loading/error + navigation trigger behavior
13. CI (optional, if approved in Open Questions):
   - Add workflow that runs format/analyze/test and builds dev+prod flavors

# 6) API / Contracts (if applicable)
- Existing endpoints used by the Flutter app:
  - `POST /api/v1/auth/login` → expects `{ email, password }`, returns `{ message, user, token }`
  - `GET /api/version` → returns `{ version }`

# 7) Permissions / Access (if applicable)
- N/A (client-side refactor only).

# 8) Commands to Run
```bash
cd home_organizer_flutter_app
flutter pub get
dart format .
flutter analyze
dart run build_runner build --delete-conflicting-outputs
flutter test
flutter run -t lib/main_local.dart
flutter run -t lib/main_dev.dart
flutter run -t lib/main_prod.dart
```

# 9) Test Plan (how we verify)
- `dart format .` produces no diff.
- `flutter analyze` is clean (no warnings promoted by rules).
- `flutter test` passes (unit + widget tests).
- Manual smoke:
  - Launch local/dev/prod entrypoints.
  - Login success stores token and redirects to dashboard.
  - Login failure shows friendly error.
  - Logout clears token and redirects to login.
  - Version label loads and handles offline/errors gracefully.

# 10) Rollback Plan
- Revert the refactor commit(s) and restore previous `lib/` structure + `pubspec.yaml` state.
- If needed, temporarily pin to the last known good tag/commit while iterating on the rule migration.

# 11) Open Questions
- Confirm we should strictly enforce the “Defaults”: **Riverpod + go_router + Dio + freezed/json_serializable** (assumed: yes).
- Logger: I will implement **Option A** (add `logger` and wrap it with `AppLogger`) to match the rule text (“use a logger package”).
- Crash reporting: do you want **Sentry** or **Crashlytics**? If yes, can you provide the DSN/config approach you prefer (env via `--dart-define` / CI secret)?
- CI: do you want me to add `/.github/workflows/flutter.yml` (GitHub Actions), or are you using a different CI provider?
- TLS behavior: I will implement **“accept bad cert only in `local` environment”** (dev/prod fail closed) to prevent shipping insecure TLS settings.

Approval

status: approved

approver: User

date: 2025-12-22

Approved. Any change in scope requires updating this doc and re-approval.

