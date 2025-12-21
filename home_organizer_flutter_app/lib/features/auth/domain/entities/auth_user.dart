import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_user.freezed.dart';

@freezed
class AuthUser with _$AuthUser {
  const factory AuthUser({
    required int id,
    required String firstName,
    required String lastName,
    required String fullName,
    required String email,
    DateTime? emailVerifiedAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _AuthUser;
}
