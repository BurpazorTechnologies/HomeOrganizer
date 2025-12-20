import 'package:flutter/widgets.dart';
import 'package:home_organizer_flutter_app/features/auth/presentation/login_page.dart';

class AppRoutes {
  AppRoutes._();

  static const String login = '/';

  static final Map<String, WidgetBuilder> routes = <String, WidgetBuilder>{
    login: (_) => const LoginPage(),
  };
}


