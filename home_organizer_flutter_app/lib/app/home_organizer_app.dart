import 'package:flutter/material.dart';
import 'package:home_organizer_flutter_app/app/app_routes.dart';
import 'package:home_organizer_flutter_app/app/app_theme.dart';

class HomeOrganizerApp extends StatelessWidget {
  const HomeOrganizerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Home Organizer',
      theme: AppTheme.lightTheme,
      initialRoute: AppRoutes.login,
      routes: AppRoutes.routes,
    );
  }
}


