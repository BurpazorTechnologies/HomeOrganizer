import 'dart:convert';

import 'package:home_organizer_flutter_app/features/auth/data/models/login_response.dart';
import 'package:home_organizer_flutter_app/services/api_client.dart';

class InvalidCredentialsException implements Exception {
  InvalidCredentialsException();
}

class AuthService {
  AuthService({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  Future<LoginResponse> login({
    required String email,
    required String password,
  }) async {
    final client = await _apiClient.getClient();

    final response = await client.post(
      _apiClient.uri('/api/v1/auth/login'),
      headers: const {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(<String, String>{
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body) as Map<String, dynamic>;
      return LoginResponse.fromJson(data);
    }

    // Laravel validation / auth failures commonly return 422.
    if (response.statusCode == 422) {
      throw InvalidCredentialsException();
    }

    throw Exception('Login failed: HTTP ${response.statusCode}');
  }

  void dispose() {
    _apiClient.dispose();
  }
}


