import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_organizer_flutter_app/features/auth/data/auth_repository_impl.dart';
import 'package:home_organizer_flutter_app/features/auth/presentation/auth_session_controller.dart';
import 'package:home_organizer_flutter_app/shared/errors/failure.dart';
import 'package:home_organizer_flutter_app/shared/logging/app_logger.dart';

final loginControllerProvider = AsyncNotifierProvider<LoginController, void>(
  LoginController.new,
);

class LoginController extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> login({required String email, required String password}) async {
    if (state.isLoading) return;
    state = const AsyncLoading();

    try {
      final repo = ref.read(authRepositoryProvider);
      final session = await repo.login(email: email, password: password);
      await ref
          .read(authSessionControllerProvider.notifier)
          .saveSession(session);
      state = const AsyncData(null);
    } catch (e, st) {
      if (e is Failure) {
        AppLogger.warn('Login failed: ${e.logSafeMessage()}');
      } else {
        AppLogger.error('Login failed', error: e, stackTrace: st);
      }
      state = AsyncError(e, st);
    }
  }
}
