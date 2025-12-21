import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_organizer_flutter_app/features/auth/domain/entities/auth_session.dart';
import 'package:home_organizer_flutter_app/shared/logging/app_logger.dart';
import 'package:home_organizer_flutter_app/shared/providers.dart';
import 'package:home_organizer_flutter_app/shared/security/auth_token_provider.dart';

final authSessionControllerProvider =
    AsyncNotifierProvider<AuthSessionController, AuthSession?>(
      AuthSessionController.new,
    );

class AuthSessionController extends AsyncNotifier<AuthSession?> {
  @override
  Future<AuthSession?> build() async {
    try {
      final token = await ref.read(tokenStorageProvider).readToken();
      ref.read(authTokenProvider.notifier).state = token;

      if (token == null || token.isEmpty) return null;
      return AuthSession(token: token);
    } catch (e, st) {
      AppLogger.error(
        'Failed to read token from secure storage',
        error: e,
        stackTrace: st,
      );
      return null;
    }
  }

  Future<void> saveSession(AuthSession session) async {
    state = const AsyncLoading();
    try {
      await ref.read(tokenStorageProvider).writeToken(session.token);
      ref.read(authTokenProvider.notifier).state = session.token;
      state = AsyncData(session);
    } catch (e, st) {
      AppLogger.error(
        'Failed to write token to secure storage',
        error: e,
        stackTrace: st,
      );
      rethrow;
    }
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    try {
      await ref.read(tokenStorageProvider).clearToken();
      ref.read(authTokenProvider.notifier).state = null;
      state = const AsyncData(null);
    } catch (e, st) {
      AppLogger.error(
        'Failed to clear token from secure storage',
        error: e,
        stackTrace: st,
      );
      rethrow;
    }
  }
}
