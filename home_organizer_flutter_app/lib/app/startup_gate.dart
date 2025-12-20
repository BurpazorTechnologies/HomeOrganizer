import 'package:flutter/material.dart';
import 'package:home_organizer_flutter_app/app/app_routes.dart';
import 'package:home_organizer_flutter_app/services/token_storage.dart';

/// A tiny "boot" screen that decides where to go based on whether a token exists.
class StartupGate extends StatefulWidget {
  const StartupGate({super.key, this.tokenStorage});

  final TokenStorage? tokenStorage;

  @override
  State<StartupGate> createState() => _StartupGateState();
}

class _StartupGateState extends State<StartupGate> {
  late final TokenStorage _tokenStorage;
  late final bool _ownsTokenStorage;

  @override
  void initState() {
    super.initState();
    _ownsTokenStorage = widget.tokenStorage == null;
    _tokenStorage = widget.tokenStorage ?? TokenStorage();
    _decideWhereToGo();
  }

  Future<void> _decideWhereToGo() async {
    final token = await _tokenStorage.readToken();
    if (!mounted) return;

    if (token != null && token.isNotEmpty) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.dashboard);
      return;
    }

    Navigator.of(context).pushReplacementNamed(AppRoutes.login);
  }

  @override
  void dispose() {
    // TokenStorage has no resources to dispose, but keep the pattern consistent.
    if (_ownsTokenStorage) {}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}


