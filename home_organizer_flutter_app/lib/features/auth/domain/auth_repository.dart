import 'package:home_organizer_flutter_app/features/auth/domain/entities/auth_session.dart';

abstract interface class AuthRepository {
  Future<AuthSession> login({required String email, required String password});
}
