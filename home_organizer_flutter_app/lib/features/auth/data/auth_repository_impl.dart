import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_organizer_flutter_app/features/auth/data/dtos/login_response_dto.dart';
import 'package:home_organizer_flutter_app/features/auth/data/mappers/auth_mapper.dart';
import 'package:home_organizer_flutter_app/features/auth/domain/auth_repository.dart';
import 'package:home_organizer_flutter_app/features/auth/domain/entities/auth_session.dart';
import 'package:home_organizer_flutter_app/shared/errors/failure.dart';
import 'package:home_organizer_flutter_app/shared/networking/dio_failure_mapper.dart';
import 'package:home_organizer_flutter_app/shared/networking/dio_provider.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(dio: ref.read(dioProvider));
});

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({required Dio dio}) : _dio = dio;

  final Dio _dio;

  @override
  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/api/v1/auth/login',
        data: <String, dynamic>{'email': email, 'password': password},
      );

      final data = response.data;
      if (data == null) {
        throw const Failure.unexpected(message: 'Empty response body');
      }

      final dto = LoginResponseDto.fromJson(data);
      return AuthMapper.sessionFromLogin(dto);
    } on DioException catch (e) {
      // In this backend, invalid credentials commonly come back as 422.
      final status = e.response?.statusCode;
      if (status == 422) {
        throw const Failure.auth(message: 'Invalid credentials');
      }
      throw DioFailureMapper.map(e);
    } on Failure {
      rethrow;
    } catch (e) {
      throw Failure.unexpected(message: e.toString());
    }
  }
}
