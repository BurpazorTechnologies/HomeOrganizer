import 'package:home_organizer_flutter_app/config/app_config.dart';

/// Development environment (shared dev backend).
///
/// Update the URL to match your dev API host.
const AppConfig devConfig = AppConfig(
  environment: AppEnvironment.dev,
  apiBaseUrl: 'https://dev.homeorganizer.xyz',
);
