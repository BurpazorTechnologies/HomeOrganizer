import 'package:freezed_annotation/freezed_annotation.dart';

part 'failure.freezed.dart';

@freezed
sealed class Failure with _$Failure {
  const Failure._();

  const factory Failure.network({String? message, int? statusCode}) =
      NetworkFailure;

  const factory Failure.auth({String? message}) = AuthFailure;

  const factory Failure.validation({String? message}) = ValidationFailure;

  const factory Failure.unexpected({String? message}) = UnexpectedFailure;

  String logSafeMessage() {
    return when(
      network: (message, statusCode) =>
          'NetworkFailure(statusCode: $statusCode, message: ${message ?? "n/a"})',
      auth: (message) => 'AuthFailure(message: ${message ?? "n/a"})',
      validation: (message) =>
          'ValidationFailure(message: ${message ?? "n/a"})',
      unexpected: (message) =>
          'UnexpectedFailure(message: ${message ?? "n/a"})',
    );
  }
}
