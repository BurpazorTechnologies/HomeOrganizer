import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:home_organizer_flutter_app/core/logging/app_logger.dart';
import 'package:http/io_client.dart';

class VersionService {
  static const String baseUrl = 'https://local.homeorganizer.xyz';

  // Cache the client to avoid recreating it on every request.
  IOClient? _client;
  bool _certificateLoaded = false;

  Future<IOClient> _getClient() async {
    if (_client != null) return _client!;

    final context = SecurityContext();

    try {
      final cert = await rootBundle.loadString('assets/cert.pem');
      context.setTrustedCertificatesBytes(utf8.encode(cert));
      _certificateLoaded = true;
      AppLogger.info('Certificate loaded successfully from assets');
    } catch (e, st) {
      _certificateLoaded = false;
      AppLogger.warn(
        'Could not load certificate from assets; accepting self-signed certificates (development only).',
      );
      AppLogger.error('Certificate load error', error: e, stackTrace: st);
    }

    final httpClient = HttpClient(context: context);

    // NOTE: This is a dev-friendly setup. In production you should be stricter
    // and validate certs/hosts properly.
    httpClient.badCertificateCallback =
        (X509Certificate cert, String host, int port) {
      if (_certificateLoaded) return true;
      return true;
    };

    _client = IOClient(httpClient);
    return _client!;
  }

  Future<String> getVersion() async {
    final client = await _getClient();
    final response = await client.get(
      Uri.parse('$baseUrl/api/version'),
      headers: {'Accept': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['version'] as String;
    }

    throw Exception('Failed to load version: ${response.statusCode}');
  }

  void dispose() {
    _client?.close();
    _client = null;
  }
}


