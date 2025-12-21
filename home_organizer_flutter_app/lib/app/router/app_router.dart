import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:home_organizer_flutter_app/app/router/app_routes.dart';
import 'package:home_organizer_flutter_app/app/startup/startup_page.dart';
import 'package:home_organizer_flutter_app/features/auth/auth.dart';
import 'package:home_organizer_flutter_app/features/dashboard/dashboard.dart';
import 'package:home_organizer_flutter_app/l10n/gen/app_localizations.dart';
import 'package:home_organizer_flutter_app/shared/logging/app_logger.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = _RouterRefreshNotifier();
  ref.onDispose(refresh.dispose);

  ref.listen(
    authSessionControllerProvider,
    (previous, next) => refresh.notify(),
  );

  return GoRouter(
    initialLocation: AppRoutes.startup,
    refreshListenable: refresh,
    routes: <RouteBase>[
      GoRoute(
        path: AppRoutes.startup,
        builder: (context, state) => const StartupPage(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: AppRoutes.dashboard,
        builder: (context, state) => const DashboardPage(),
      ),
    ],
    redirect: (context, state) {
      final auth = ref.read(authSessionControllerProvider);

      // While auth is resolving (startup / login / logout), do not force a redirect.
      if (auth.isLoading) return null;

      final isLoggedIn = auth.valueOrNull != null;
      final isAtLogin = state.matchedLocation == AppRoutes.login;
      final isAtDashboard = state.matchedLocation == AppRoutes.dashboard;
      final isAtStartup = state.matchedLocation == AppRoutes.startup;

      if (!isLoggedIn) {
        return isAtLogin ? null : AppRoutes.login;
      }

      // Logged in
      if (isAtLogin || isAtStartup) return AppRoutes.dashboard;
      if (isAtDashboard) return null;
      return AppRoutes.dashboard;
    },
    errorBuilder: (context, state) {
      AppLogger.error('Router error', error: state.error);
      final l10n = AppLocalizations.of(context);
      return Scaffold(
        body: Center(child: Text(l10n?.commonSomethingWentWrong ?? '')),
      );
    },
  );
});

class _RouterRefreshNotifier extends ChangeNotifier {
  void notify() => notifyListeners();
}
