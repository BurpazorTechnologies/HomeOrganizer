// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Home Organizer';

  @override
  String get commonLoading => 'Loading…';

  @override
  String get commonSomethingWentWrong => 'Something went wrong.';

  @override
  String get commonLogout => 'Logout';

  @override
  String get startupLoading => 'Starting…';

  @override
  String get authLoginTitle => 'Login';

  @override
  String get authEmailLabel => 'Email';

  @override
  String get authEmailRequired => 'Email is required';

  @override
  String get authEmailInvalid => 'Enter a valid email';

  @override
  String get authPasswordLabel => 'Password';

  @override
  String get authPasswordRequired => 'Password is required';

  @override
  String get authLoginButton => 'Login';

  @override
  String get authLoginInvalidCredentials => 'Invalid login credentials';

  @override
  String get authLoginFailedGeneric => 'Login failed. Please try again.';

  @override
  String get authLoginTooManyAttempts =>
      'Too many login attempts. Please wait a minute and try again.';

  @override
  String get authPasswordVisibilityShow => 'Show password';

  @override
  String get authPasswordVisibilityHide => 'Hide password';

  @override
  String get dashboardTitle => 'Dashboard';

  @override
  String get dashboardWelcome => 'Welcome to dashboard';

  @override
  String get versionLoading => 'Backend version: loading…';

  @override
  String get versionUnavailable => 'Backend version: unavailable';

  @override
  String versionValue(Object version) {
    return 'Backend version: $version';
  }
}
