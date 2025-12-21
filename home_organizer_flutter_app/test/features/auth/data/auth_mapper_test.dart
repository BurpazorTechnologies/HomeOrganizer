import 'package:flutter_test/flutter_test.dart';
import 'package:home_organizer_flutter_app/features/auth/data/dtos/login_response_dto.dart';
import 'package:home_organizer_flutter_app/features/auth/data/dtos/login_user_dto.dart';
import 'package:home_organizer_flutter_app/features/auth/data/mappers/auth_mapper.dart';

void main() {
  test('maps login response DTO to domain session + user', () {
    final now = DateTime.utc(2025, 1, 1);
    final dto = LoginResponseDto(
      message: 'ok',
      token: 'token-123',
      user: LoginUserDto(
        id: 1,
        firstName: 'Ada',
        lastName: 'Lovelace',
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      ),
    );

    final session = AuthMapper.sessionFromLogin(dto);
    expect(session.token, 'token-123');
    expect(session.user?.id, 1);
    expect(session.user?.fullName, 'Ada Lovelace');
    expect(session.user?.email, 'ada@example.com');
  });
}
