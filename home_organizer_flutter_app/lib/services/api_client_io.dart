import 'dart:convert';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:home_organizer_flutter_app/core/logging/app_logger.dart';
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart';

class ApiClientImpl {
  IOClient? _client;
  bool _certificateLoaded = false;

  Future<http.Client> getClient() async {
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

    // NOTE: Dev-friendly configuration. In production you should validate certs
    // and hosts properly.
    httpClient.badCertificateCallback =
        (X509Certificate cert, String host, int port) {
      if (_certificateLoaded) return true;
      return true;
    };

    _client = IOClient(httpClient);
    return _client!;
  }

  void dispose() {
    _client?.close();
    _client = null;
  }
}


