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
  ///
  /// Defaults to "local" so a missing [set] doesn't crash in development.
  static AppConfig get instance =>
      _instance ??
      const AppConfig(
        environment: AppEnvironment.local,
        apiBaseUrl: 'https://local.homeorganizer.xyz',
      );

  static void set(AppConfig config) {
    _instance = config;
  }
}
