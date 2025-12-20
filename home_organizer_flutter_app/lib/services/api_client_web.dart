import 'package:http/http.dart' as http;

class ApiClientImpl {
  http.Client? _client;

  Future<http.Client> getClient() async {
    _client ??= http.Client();
    return _client!;
  }

  void dispose() {
    _client?.close();
    _client = null;
  }
}


