import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_organizer_flutter_app/features/version/domain/version_repository.dart';
import 'package:home_organizer_flutter_app/shared/errors/failure.dart';
import 'package:home_organizer_flutter_app/shared/networking/dio_failure_mapper.dart';
import 'package:home_organizer_flutter_app/shared/networking/dio_provider.dart';

final versionRepositoryProvider = Provider<VersionRepository>((ref) {
  return VersionRepositoryImpl(dio: ref.read(dioProvider));
});

class VersionRepositoryImpl implements VersionRepository {
  VersionRepositoryImpl({required Dio dio}) : _dio = dio;

  final Dio _dio;

  @override
  Future<String> getVersion() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/api/version');
      final data = response.data;
      if (data == null) {
        throw const Failure.unexpected(message: 'Empty response body');
      }
      final version = data['version'];
      if (version is! String) {
        throw const Failure.unexpected(message: 'Invalid version response');
      }
      return version;
    } on DioException catch (e) {
      throw DioFailureMapper.map(e);
    } on Failure {
      rethrow;
    } catch (e) {
      throw Failure.unexpected(message: e.toString());
    }
  }
}
