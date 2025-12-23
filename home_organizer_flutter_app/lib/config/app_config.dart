enum AppEnvironment { local, dev, prod }

/// Centralized, environment-specific configuration.
///
/// Note:
/// - These values are shipped with the app; do not store secrets here.
/// - Select the environment by running a specific entrypoint (e.g. main_dev.dart)
///   which sets [AppConfig.set] before the app starts.
class AppConfig {
  const AppConfig({required this.environment, required this.apiBaseUrl});

  final AppEnvironment environment;
  final String apiBaseUrl;

  static AppConfig? _instance;

  /// Current config for the running app.
  static AppConfig get instance {
    final config = _instance;
    if (config == null) {
      throw StateError(
        'AppConfig is not set. Run an environment entrypoint (e.g. lib/main_local.dart) '
        'that calls AppConfig.set(...) before runApp().',
      );
    }
    return config;
  }

  static void set(AppConfig config) {
    _instance = config;
  }
}
