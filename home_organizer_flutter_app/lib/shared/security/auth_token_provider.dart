import 'package:flutter_riverpod/flutter_riverpod.dart';

/// In-memory auth token used for request auth headers.
///
/// Source of truth remains secure storage; controllers sync this at startup/login/logout.
final authTokenProvider = StateProvider<String?>((ref) => null);
