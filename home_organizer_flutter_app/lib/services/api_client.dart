import 'package:http/http.dart' as http;

import 'api_client_io.dart' if (dart.library.html) 'api_client_web.dart'
    as impl;
import 'package:home_organizer_flutter_app/config/app_config.dart';

/// Shared HTTP client wrapper for the app.
///
/// This is split into platform implementations so the app can run on web too:
/// - IO platforms: uses `IOClient` + optional dev cert.
/// - Web: uses the default `http.Client`.
class ApiClient {
  ApiClient() : _impl = impl.ApiClientImpl();

  final impl.ApiClientImpl _impl;

  /// Base host for your backend.
  ///
  /// This is your `{{host}}`.
  static String get baseUrl => AppConfig.instance.apiBaseUrl;

  Uri uri(String path) => Uri.parse('$baseUrl$path');

  Future<http.Client> getClient() => _impl.getClient();

  void dispose() => _impl.dispose();
}


