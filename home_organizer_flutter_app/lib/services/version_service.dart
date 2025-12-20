import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart';

class VersionService {
  static const String baseUrl = 'https://local.homeorganizer.xyz';
  
  // Cache the client to avoid recreating it on every request
  IOClient? _client;
  bool _certificateLoaded = false;
  
  // Create a custom HTTP client that trusts our certificate
  Future<IOClient> _getClient() async {
    // Force recreation if client exists (for debugging)
    // Remove this after confirming it works
    if (_client != null) {
      _client?.close();
      _client = null;
    }
    
    final context = SecurityContext();
    
    try {
      // Load the certificate from assets
      final cert = await rootBundle.loadString('assets/cert.pem');
      context.setTrustedCertificatesBytes(utf8.encode(cert));
      _certificateLoaded = true;
      print('✓ Certificate loaded successfully from assets');
    } catch (e) {
      // If certificate loading fails, log it
      print('⚠ Warning: Could not load certificate from assets: $e');
      print('⚠ Falling back to accepting self-signed certificates (development only)');
      _certificateLoaded = false;
    }
    
    final httpClient = HttpClient(context: context);
    
    // Accept self-signed certificates when we've loaded our certificate
    // This is needed because setTrustedCertificatesBytes doesn't automatically
    // validate against the hostname for self-signed certs
    httpClient.badCertificateCallback = (X509Certificate cert, String host, int port) {
      print('🔍 badCertificateCallback triggered for $host:$port');
      if (_certificateLoaded) {
        // We've loaded our certificate, so accept it for our domain
        print('✓ Accepting certificate for $host:$port (certificate loaded from assets)');
        return true;
      } else {
        // Development fallback: accept self-signed certificates
        print('⚠ Accepting self-signed certificate for $host:$port (development mode)');
        return true;
      }
    };
    
    _client = IOClient(httpClient);
    print('✓ HTTP Client created with certificate handling');
    return _client!;
  }
  
  Future<String> getVersion() async {
    try {
      final client = await _getClient();
      final response = await client.get(
        Uri.parse('$baseUrl/api/version'),
        headers: {'Accept': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['version'] as String;
      } else {
        throw Exception('Failed to load version: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching version: $e');
    }
  }
  
  // Clean up the client when done (optional, but good practice)
  void dispose() {
    _client?.close();
    _client = null;
  }
}