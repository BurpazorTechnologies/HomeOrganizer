// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'login_response_dto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$LoginResponseDtoImpl _$$LoginResponseDtoImplFromJson(
  Map<String, dynamic> json,
) => _$LoginResponseDtoImpl(
  token: json['token'] as String,
  expiresAt: DateTime.parse(json['expires_at'] as String),
  service: json['service'] as String,
  type: json['type'] as String,
  context: json['context'] as String,
  guard: json['guard'] as String,
);

Map<String, dynamic> _$$LoginResponseDtoImplToJson(
  _$LoginResponseDtoImpl instance,
) => <String, dynamic>{
  'token': instance.token,
  'expires_at': instance.expiresAt.toIso8601String(),
  'service': instance.service,
  'type': instance.type,
  'context': instance.context,
  'guard': instance.guard,
};
