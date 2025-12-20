import 'package:flutter/widgets.dart';
import 'package:home_organizer_flutter_app/app/startup_gate.dart';
import 'package:home_organizer_flutter_app/features/auth/presentation/login_page.dart';
import 'package:home_organizer_flutter_app/features/dashboard/presentation/dashboard_page.dart';

class AppRoutes {
  AppRoutes._();

  static const String startup = '/';
  static const String login = '/login';
  static const String dashboard = '/dashboard';

  static final Map<String, WidgetBuilder> routes = <String, WidgetBuilder>{
    startup: (_) => const StartupGate(),
    login: (_) => const LoginPage(),
    dashboard: (_) => const DashboardPage(),
  };
}


