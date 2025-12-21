import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:home_organizer_flutter_app/features/auth/data/dtos/login_user_dto.dart';

part 'login_response_dto.freezed.dart';
part 'login_response_dto.g.dart';

@freezed
class LoginResponseDto with _$LoginResponseDto {
  const factory LoginResponseDto({
    required String message,
    required LoginUserDto user,
    required String token,
  }) = _LoginResponseDto;

  factory LoginResponseDto.fromJson(Map<String, dynamic> json) =>
      _$LoginResponseDtoFromJson(json);
}
