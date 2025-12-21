import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:home_organizer_flutter_app/features/auth/data/auth_repository_impl.dart';
import 'package:home_organizer_flutter_app/features/auth/domain/auth_repository.dart';
import 'package:home_organizer_flutter_app/features/auth/domain/entities/auth_session.dart';
import 'package:home_organizer_flutter_app/features/auth/presentation/login_page.dart';
import 'package:home_organizer_flutter_app/features/version/data/version_repository_impl.dart';
import 'package:home_organizer_flutter_app/features/version/domain/version_repository.dart';
import 'package:home_organizer_flutter_app/l10n/gen/app_localizations.dart';
import 'package:home_organizer_flutter_app/shared/errors/failure.dart';
import 'package:home_organizer_flutter_app/shared/providers.dart';
import 'package:home_organizer_flutter_app/shared/security/token_storage.dart';

class _FakeTokenStorage implements TokenStorage {
  String? _token;

  @override
  Future<void> clearToken() async {
    _token = null;
  }

  @override
  Future<String?> readToken() async => _token;

  @override
  Future<void> writeToken(String token) async {
    _token = token;
  }
}

class _FakeVersionRepository implements VersionRepository {
  _FakeVersionRepository(this._version);

  final String _version;

  @override
  Future<String> getVersion() async => _version;
}

class _FailingAuthRepository implements AuthRepository {
  @override
  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    throw const Failure.auth(message: 'Invalid credentials');
  }
}

Widget _wrap(Widget child, {required List<Override> overrides}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: AppLocalizations.supportedLocales,
      home: child,
    ),
  );
}

void main() {
  testWidgets('shows invalid credentials message on auth failure', (
    tester,
  ) async {
    final fakeStorage = _FakeTokenStorage();

    await tester.pumpWidget(
      _wrap(
        const LoginPage(),
        overrides: [
          tokenStorageProvider.overrideWithValue(fakeStorage),
          authRepositoryProvider.overrideWithValue(_FailingAuthRepository()),
          versionRepositoryProvider.overrideWithValue(
            _FakeVersionRepository('1.2.3'),
          ),
        ],
      ),
    );

    // Let version load.
    await tester.pumpAndSettle();

    final fields = find.byType(TextFormField);
    expect(fields, findsNWidgets(2));

    await tester.enterText(fields.at(0), 'user@example.com');
    await tester.enterText(fields.at(1), 'password');

    await tester.tap(find.widgetWithText(ElevatedButton, 'Login'));
    await tester.pumpAndSettle();

    expect(find.text('Invalid login credentials'), findsOneWidget);
  });
}
