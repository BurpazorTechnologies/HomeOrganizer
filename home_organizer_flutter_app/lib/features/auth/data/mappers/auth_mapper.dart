import 'package:home_organizer_flutter_app/features/auth/data/dtos/login_response_dto.dart';
import 'package:home_organizer_flutter_app/features/auth/domain/entities/auth_session.dart';
import 'package:home_organizer_flutter_app/features/auth/domain/entities/auth_user.dart';

class AuthMapper {
  AuthMapper._();

  static AuthSession sessionFromLogin(LoginResponseDto dto) {
    return AuthSession(token: dto.token, user: _userFromLogin(dto));
  }

  static AuthUser _userFromLogin(LoginResponseDto dto) {
    final u = dto.user;
    return AuthUser(
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: u.fullName,
      email: u.email,
      emailVerifiedAt: u.emailVerifiedAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    );
  }
}
