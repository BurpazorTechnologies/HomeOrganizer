import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_organizer_flutter_app/shared/security/secure_token_storage.dart';
import 'package:home_organizer_flutter_app/shared/security/token_storage.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return SecureTokenStorage();
});
