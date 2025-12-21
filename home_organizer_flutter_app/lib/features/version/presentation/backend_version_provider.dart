import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_organizer_flutter_app/features/version/data/version_repository_impl.dart';

final backendVersionProvider = FutureProvider<String>((ref) async {
  final repo = ref.read(versionRepositoryProvider);
  return repo.getVersion();
});
