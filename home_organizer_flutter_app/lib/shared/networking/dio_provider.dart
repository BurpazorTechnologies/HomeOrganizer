import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_organizer_flutter_app/config/app_config.dart';
import 'package:home_organizer_flutter_app/shared/logging/app_logger.dart';
import 'package:home_organizer_flutter_app/shared/networking/request_id.dart';
import 'package:home_organizer_flutter_app/shared/security/auth_token_provider.dart';

final dioProvider = Provider<Dio>((ref) {
  final baseUrl = AppConfig.instance.apiBaseUrl;
  final env = AppConfig.instance.environment;

  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: const {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ),
  );

  // Local-only TLS relaxation (IO only). Web TLS is controlled by the browser.
  if (!kIsWeb) {
    dio.httpClientAdapter = IOHttpClientAdapter(
      createHttpClient: () {
        final client = HttpClient();
        if (env == AppEnvironment.local) {
          client.badCertificateCallback = (cert, host, port) => true;
        }
        return client;
      },
    );
  }

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final requestId = RequestId.newId();
        options.headers['X-Request-Id'] = requestId;

        final token = ref.read(authTokenProvider);
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        // Safe logging (redact secrets).
        final safeHeaders = Map<String, dynamic>.from(options.headers);
        if (safeHeaders.containsKey('Authorization')) {
          safeHeaders['Authorization'] = 'Bearer <redacted>';
        }

        AppLogger.info(
          '[HTTP] -> ${options.method} ${options.uri} headers=$safeHeaders',
        );
        handler.next(options);
      },
      onResponse: (response, handler) {
        final status = response.statusCode;
        final uri = response.requestOptions.uri;

        final shouldLogBody =
            env == AppEnvironment.local && !kReleaseMode && !kIsWeb;

        if (shouldLogBody && response.data != null) {
          AppLogger.info(
            '[HTTP] <- $status $uri body=${_redactJson(response.data)}',
          );
        } else {
          AppLogger.info('[HTTP] <- $status $uri');
        }
        handler.next(response);
      },
      onError: (error, handler) {
        final status = error.response?.statusCode;
        AppLogger.warn(
          '[HTTP] !! ${error.requestOptions.method} ${error.requestOptions.uri} status=$status ${error.type} ${error.message}',
        );

        final shouldLogBody =
            env == AppEnvironment.local && !kReleaseMode && !kIsWeb;
        final data = error.response?.data;
        if (shouldLogBody && data != null) {
          AppLogger.warn('[HTTP] !! responseBody=${_redactJson(data)}');
        }

        handler.next(error);
      },
    ),
  );

  return dio;
});

Object _redactJson(Object? value) {
  if (value is Map) {
    final out = <String, Object?>{};
    for (final entry in value.entries) {
      final key = entry.key.toString();
      final v = entry.value;
      if (_isSensitiveKey(key)) {
        out[key] = '<redacted>';
      } else if (v is Map || v is List) {
        out[key] = _redactJson(v);
      } else {
        out[key] = v is String && v.length > 300
            ? '${v.substring(0, 300)}…'
            : v as Object?;
      }
    }
    return out;
  }

  if (value is List) {
    return value.map((e) => _redactJson(e)).toList();
  }

  return value ?? '<null>';
}

/// Set to `true` only when you explicitly want to log tokens/PII in local debug.
///
/// Prefer enabling via:
/// `flutter run -t lib/main_local.dart --dart-define=UNREDACT_HTTP_LOGS=true`
const bool _unredactHttpLogs = bool.fromEnvironment(
  'UNREDACT_HTTP_LOGS',
  defaultValue: false,
);

bool _isSensitiveKey(String key) {
  if (_unredactHttpLogs) return false;

  final k = key.toLowerCase();
  return k.contains('token') ||
      k.contains('authorization') ||
      k.contains('password') ||
      k == 'email' ||
      k == 'first_name' ||
      k == 'last_name' ||
      k == 'full_name';
}
