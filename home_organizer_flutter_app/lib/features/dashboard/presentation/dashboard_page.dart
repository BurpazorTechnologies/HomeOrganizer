import 'package:flutter/material.dart';
import 'package:home_organizer_flutter_app/app/app_routes.dart';
import 'package:home_organizer_flutter_app/services/token_storage.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key, this.tokenStorage});

  final TokenStorage? tokenStorage;

  Future<void> _logout(BuildContext context) async {
    final storage = tokenStorage ?? TokenStorage();
    await storage.clearToken();
    if (!context.mounted) return;
    Navigator.of(context).pushReplacementNamed(AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          TextButton(
            onPressed: () => _logout(context),
            child: const Text('Logout'),
          ),
        ],
      ),
      body: const SafeArea(
        child: Center(
          child: Text('Welcome to dashboard'),
        ),
      ),
    );
  }
}


