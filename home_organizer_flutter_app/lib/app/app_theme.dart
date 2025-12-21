import 'package:flutter/material.dart';
import 'package:home_organizer_flutter_app/app/theme/app_tokens.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: AppTokens.light.seedColor),
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(),
    ),
    extensions: const <ThemeExtension<dynamic>>[AppTokens.light],
  );

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppTokens.dark.seedColor,
      brightness: Brightness.dark,
    ),
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(),
    ),
    extensions: const <ThemeExtension<dynamic>>[AppTokens.dark],
  );
}
