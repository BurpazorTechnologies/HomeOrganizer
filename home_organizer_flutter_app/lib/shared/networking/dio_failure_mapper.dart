import 'package:dio/dio.dart';
import 'package:home_organizer_flutter_app/shared/errors/failure.dart';

class DioFailureMapper {
  DioFailureMapper._();

  static Failure map(DioException e) {
    final statusCode = e.response?.statusCode;

    if (statusCode == 429) {
      return const Failure.network(
        statusCode: 429,
        message: 'Too many requests',
      );
    }

    // Auth / validation
    if (statusCode == 401 || statusCode == 403) {
      return Failure.auth(message: 'Unauthorized');
    }
    if (statusCode == 422) {
      return Failure.validation(message: 'Validation failed');
    }

    // Network / timeouts
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return Failure.network(statusCode: statusCode, message: e.message);
      case DioExceptionType.badCertificate:
        return Failure.network(
          statusCode: statusCode,
          message: 'Bad certificate',
        );
      case DioExceptionType.badResponse:
        return Failure.network(statusCode: statusCode, message: 'Bad response');
      case DioExceptionType.cancel:
        return Failure.network(
          statusCode: statusCode,
          message: 'Request cancelled',
        );
      case DioExceptionType.unknown:
        return Failure.unexpected(message: e.message);
    }
  }
}
