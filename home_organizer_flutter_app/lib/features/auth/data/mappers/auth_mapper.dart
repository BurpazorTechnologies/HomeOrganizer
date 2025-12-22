import 'package:home_organizer_flutter_app/features/auth/data/dtos/login_response_dto.dart';
import 'package:home_organizer_flutter_app/features/auth/domain/entities/auth_session.dart';

class AuthMapper {
  AuthMapper._();

  static AuthSession sessionFromLogin(LoginResponseDto dto) {
    return AuthSession(token: dto.token);
  }
}
