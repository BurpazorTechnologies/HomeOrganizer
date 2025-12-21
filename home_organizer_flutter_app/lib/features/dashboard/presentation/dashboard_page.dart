import 'package:flutter/material.dart';
import 'package:home_organizer_flutter_app/l10n/gen/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_organizer_flutter_app/app/theme/app_tokens.dart';
import 'package:home_organizer_flutter_app/features/auth/auth.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    if (l10n == null) return const SizedBox.shrink();

    final auth = ref.watch(authSessionControllerProvider);
    final logoutDisabled = auth.isLoading;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.dashboardTitle),
        actions: [
          TextButton(
            onPressed: logoutDisabled
                ? null
                : () =>
                      ref.read(authSessionControllerProvider.notifier).logout(),
            child: Text(l10n.commonLogout),
          ),
        ],
      ),
      body: const SafeArea(child: _DashboardBody()),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  const _DashboardBody();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (l10n == null) return const SizedBox.shrink();

    final tokens = context.tokens;
    return Center(
      child: Padding(
        padding: EdgeInsets.all(tokens.spacingM),
        child: Text(l10n.dashboardWelcome),
      ),
    );
  }
}
