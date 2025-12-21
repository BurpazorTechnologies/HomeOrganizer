---
title: "Audit home_organizer_flutter_app rule compliance"
id: "20251222-0900-flutter-rules-audit"
status: approved
owner: "AI"
requires_approval: true
---

# 1) Summary / Goal
- Review the Flutter app (`home_organizer_flutter_app`) against the documented workspace rules in `.cursor/rules/home_organizer_flutter_app/*.mdc`.
- Produce a rule-by-rule compliance report with concrete evidence (file refs) and minimal, targeted remediation suggestions where gaps exist.

# 2) MVP Scope (Do the minimum)
- In-scope:
  - Read all Flutter rule docs (00–90 series) and extract actionable requirements.
  - Scan the Flutter app code/config to verify alignment (structure, lints, state mgmt, networking, error handling, flavors, etc.).
  - Deliver a checklist: ✅ compliant / ⚠️ partially / ❌ missing, plus suggested minimal fixes (no refactors).
- Out-of-scope:
  - Implementing code changes (unless explicitly requested after the audit).
  - Architectural refactors or dependency/tooling changes.

# 3) Assumptions & Constraints
- Environment: audit will be read-only via repository inspection (no DB/backend impacts).
- Only the Flutter app is audited (no backend/Laravel changes).
- Rules are treated as the source of truth; where a rule is ambiguous, I will flag it and ask a clarifying question instead of guessing.

# 4) Files to Change (strict allow-list)
- None (audit-only). If remediation is requested, I will update this plan with an explicit allow-list before editing anything.

# 5) Implementation Steps (ordered, checklist)
1. Read `.cursor/rules/home_organizer_flutter_app/*.mdc` and distill each into verifiable checks.
2. Inventory current Flutter app structure and entrypoints (`lib/main*.dart`, routing, theming, DI/state mgmt, data layer).
3. Verify static analysis/lints configuration (`analysis_options.yaml`) and key CI/build hooks if present.
4. Spot-check performance/a11y guidance (widget rebuild patterns, const usage, semantics/i18n scaffolding).
5. Validate networking/repository patterns, serialization/codegen usage, storage/offline behavior, error handling/logging, and security/privacy.
6. Produce the compliance matrix + prioritized gap list + minimal remediation suggestions (snippets/paths).

# 6) API / Contracts (if applicable)
- N/A (audit only).

# 7) Permissions / Access (if applicable)
- N/A.

# 8) Commands to Run
```bash
cd home_organizer_flutter_app
flutter --version
flutter pub get
flutter analyze
flutter test
# Optional build sanity checks:
flutter build apk --debug
flutter build ios --simulator
```

# 9) Test Plan (how we verify)
- `flutter analyze` passes with no new warnings/errors.
- `flutter test` passes.
- App launches for at least one flavor/entrypoint (`main_dev.dart` / `main_local.dart` / `main_prod.dart`) without runtime exceptions.

# 10) Rollback Plan
- N/A (no changes).

# 11) Open Questions
- Should the audit be strict (must-follow) or advisory (best-effort), especially for rules that are phrased as “should” vs “must”?
- Are there any non-standard conventions you intentionally deviated from (e.g., state management choice) that I should treat as acceptable?

Approval

status: approved

approver: User

date: 2025-12-22

Approved. Any change in scope requires updating this doc and re-approval.

---

# Audit Results (2025-12-22)

## Quick takeaway
- You **implemented the environment entrypoints/config rule well** (local/dev/prod).
- Most other rules are **not yet implemented** because the app is currently a lightweight scaffold using **`MaterialApp` + `http` + local `StatefulWidget` state**, while the rules assume **Riverpod + go_router + Dio + freezed/json_serializable + typed failures + i18n**.

## Rule-by-rule compliance (✅ / ⚠️ / ❌)

### `00-global-flutter-guardrails.mdc` — ⚠️ Partial
- **OK**: Null-safety, mostly-immutable models (`final` fields), no side effects in `build()` for the current screens.
- **Not aligned**:
  - Defaults not adopted: **Riverpod/go_router/Dio/freezed** not present.
  - UI imports and uses concrete services directly (e.g. `LoginPage` -> `AuthService`, `VersionService`).
  - Token persisted via `shared_preferences` (not secure storage).

### `01-dart-style-lints-analysis.mdc` — ⚠️ Partial
- **OK**: Uses `flutter_lints` baseline; no `print(` usages found in `lib/`.
- **Not aligned**:
  - Lints are disabled (e.g. `avoid_print: false`, `prefer_const_*: false`) in `analysis_options.yaml`.
  - No codegen discipline in place (no build_runner usage; no generated files because freezed/json_serializable not used).

### `05-project-structure-architecture.mdc` — ⚠️ Partial
- **OK**: Feature-first folders exist: `lib/features/auth`, `lib/features/dashboard`, `lib/features/version`.
- **Not aligned**:
  - No `domain/` layer anywhere under `lib/features/*`.
  - No feature public API barrel files (`features/<feature>/<feature>.dart`).
  - `app/app_routes.dart` imports feature internals directly.

### `10-widgets-composition.mdc` — ⚠️ Partial
- **OK**: No navigation/network in `build()`; controllers are disposed in `LoginPage`.
- **Not aligned**: Business logic (login flow, storage writes) lives inside UI state classes instead of controllers/notifiers.

### `12-ui-performance-rebuilds.mdc` — ⚠️ Partial
- **OK**: UI is small; no obvious rebuild/perf pitfalls for current scope.
- **Not aligned / N/A yet**: Riverpod rebuild-scoping rules (`ref.watch`, `select`) can’t be met because Riverpod isn’t used.

### `15-state-management.mdc` — ❌ Missing
- **Not implemented**: No Riverpod providers/controllers; state is handled locally with `StatefulWidget`.

### `20-navigation-routing.mdc` — ❌ Missing (with a small partial)
- **Partial**: Centralized route constants exist in `lib/app/app_routes.dart`.
- **Not implemented**: Not using `go_router`, no redirect/guard system in router; startup/auth gate is implemented as a widget (`StartupGate`).

### `25-theming-design-system.mdc` — ⚠️ Partial
- **OK**: Theme is centralized (`lib/app/app_theme.dart`).
- **Not aligned**: No tokens/ThemeExtensions; hardcoded colors exist (e.g. `Colors.teal`); no dark theme config.

### `30-forms-validation.mdc` — ⚠️ Partial
- **OK**: Controllers disposed; submit disabled while loading; field + submit errors are distinct.
- **Not aligned**: Validators are embedded inline in widgets (not shared/domain); no reusable validator layer.

### `40-networking-api.mdc` — ❌ Missing
- **Not implemented**: Uses `http` client, not Dio; no central timeouts/interceptors/typed failure mapping; no cancel tokens.

### `45-models-serialization-codegen.mdc` — ❌ Missing
- **Not implemented**: DTO/entity split + mapper layer not present; no freezed/json_serializable codegen.

### `50-data-layer-repositories.mdc` — ❌ Missing
- **Not implemented**: No domain repository interfaces; services are called directly from presentation.

### `55-storage-cache-offline.mdc` — ⚠️ Partial (security gap)
- **OK**: Token cleared on logout.
- **Not aligned**:
  - Tokens stored in `shared_preferences` (should be secure storage).
  - Storage calls exist inside widgets (`StartupGate`, `DashboardPage`, `LoginPage`).
  - No offline/caching strategy documentation/implementation yet.

### `60-error-handling-logging.mdc` — ⚠️ Partial
- **OK**: Central logger wrapper exists (`AppLogger`); UI shows friendly error text for login.
- **Not aligned**: No typed domain failures; exceptions bubble as generic `Exception`; no crash reporting setup.

### `65-security-privacy.mdc` — ❌ Missing (with concrete issues)
- **Not aligned**:
  - Tokens persisted in non-secure storage.
  - IO HTTP client accepts bad certificates unconditionally (see `api_client_io.dart`).
- **OK**: No obvious hardcoded API keys; base URLs live in `lib/config/*.dart`.

### `70-testing.mdc` — ❌ Missing
- `home_organizer_flutter_app/test/widget_test.dart` is empty; no unit/widget/integration tests implemented.

### `75-i18n-a11y.mdc` — ❌ Missing
- **Not implemented**: No `intl` / ARB workflow; user-facing strings are hardcoded across UI.
- **A11y gap**: Icon-only controls (e.g. password visibility) lack semantics/tooltip labeling.

### `80-build-flavors-env.mdc` — ✅ Compliant
- Entrypoints exist and set `AppConfig` before `runApp()`:
  - `lib/main_local.dart`, `lib/main_dev.dart`, `lib/main_prod.dart`
- Env values live only in:
  - `lib/config/local.dart`, `lib/config/dev.dart`, `lib/config/prod.dart`
- App reads base URL via `AppConfig.instance` (e.g. `ApiClient.baseUrl`).

### `90-ci-cd-release.mdc` — ❌ Missing
- No CI workflow found that runs format/analyze/tests/builds (no `.github/workflows/*`, `.gitlab-ci.yml`, etc.).

## Next steps (optional)
- Decide whether the “Defaults” (Riverpod/go_router/Dio/freezed) are strict requirements; if not, update the rules to match the current stack.
- If strict, fix the **security-critical** gaps first: token storage (secure storage) + TLS/cert handling.
- Establish the architecture baseline: add `domain/` + repository interfaces and stop calling data services directly from widgets.
- Add i18n + a11y scaffolding (intl/ARB + semantics/tooltip for icon-only controls) before UI grows.
- Add CI checks required by your rule (`dart format`, `dart analyze`, `flutter test`, flavor builds).

