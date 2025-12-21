import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:home_organizer_flutter_app/features/auth/domain/entities/auth_user.dart';

part 'auth_session.freezed.dart';

@freezed
class AuthSession with _$AuthSession {
  const factory AuthSession({required String token, AuthUser? user}) =
      _AuthSession;
}
