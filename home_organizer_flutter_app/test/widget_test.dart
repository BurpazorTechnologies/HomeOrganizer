// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:home_organizer_flutter_app/features/auth/presentation/login_page.dart';
import 'package:home_organizer_flutter_app/features/version/data/version_service.dart';

class _FakeVersionService extends VersionService {
  @override
  Future<String> getVersion() async => 'test-version';
}

void main() {
  testWidgets('Login screen smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: LoginPage(versionService: _FakeVersionService()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Home Organizer'), findsOneWidget);
    expect(find.text('Backend version: test-version'), findsOneWidget);

    final fields = find.byType(TextFormField);
    expect(fields, findsNWidgets(2));

    await tester.enterText(fields.first, 'test@example.com');
    await tester.enterText(fields.at(1), 'password');

    await tester.tap(find.widgetWithText(ElevatedButton, 'Login'));
    await tester.pump();
  });
}
