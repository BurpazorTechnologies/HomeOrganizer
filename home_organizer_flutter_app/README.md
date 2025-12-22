# home_organizer_flutter_app

## Local Development
```
install XCode + run IOS simulator first

// run the app
flutter run --dart-define=UNREDACT_HTTP_LOGS=true

// hot reload
r

// Hot restart (recompiles)
R

// rebuild generated files
dart run build_runner build --delete-conflicting-outputs
```

## Environments (local / dev / prod)

This app selects its environment via **separate entrypoints**:

- `lib/main_local.dart` (default)
- `lib/main_dev.dart`
- `lib/main_prod.dart`

Each entrypoint sets `AppConfig` before the app starts. Environment values live in:

- `lib/config/local.dart`
- `lib/config/dev.dart`
- `lib/config/prod.dart`

### Run (choose one)

```bash
# local (default)
flutter run -t lib/main_local.dart

# dev
flutter run -t lib/main_dev.dart

# prod
flutter run -t lib/main_prod.dart
```

### Build (choose one)

```bash
# Android example
flutter build apk -t lib/main_dev.dart

# iOS example
flutter build ios -t lib/main_prod.dart
```
