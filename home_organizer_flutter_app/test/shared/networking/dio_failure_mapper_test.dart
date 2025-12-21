import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:home_organizer_flutter_app/shared/errors/failure.dart';
import 'package:home_organizer_flutter_app/shared/networking/dio_failure_mapper.dart';

void main() {
  test('maps 401/403 to auth failure', () {
    final request = RequestOptions(path: '/secure');

    final unauthorized = DioException(
      requestOptions: request,
      response: Response<void>(requestOptions: request, statusCode: 401),
      type: DioExceptionType.badResponse,
    );
    expect(DioFailureMapper.map(unauthorized), isA<AuthFailure>());

    final forbidden = DioException(
      requestOptions: request,
      response: Response<void>(requestOptions: request, statusCode: 403),
      type: DioExceptionType.badResponse,
    );
    expect(DioFailureMapper.map(forbidden), isA<AuthFailure>());
  });

  test('maps connection timeout to network failure', () {
    final request = RequestOptions(path: '/timeout');
    final e = DioException(
      requestOptions: request,
      type: DioExceptionType.connectionTimeout,
      message: 'timeout',
    );
    expect(DioFailureMapper.map(e), isA<NetworkFailure>());
  });
}
