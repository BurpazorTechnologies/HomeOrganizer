import 'dart:convert';

import 'package:home_organizer_flutter_app/services/api_client.dart';

class VersionService {
  VersionService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  Future<String> getVersion() async {
    final client = await _apiClient.getClient();
    final response = await client.get(
      _apiClient.uri('/api/version'),
      headers: {'Accept': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['version'] as String;
    }

    throw Exception('Failed to load version: ${response.statusCode}');
  }

  void dispose() {
    _apiClient.dispose();
  }
}


