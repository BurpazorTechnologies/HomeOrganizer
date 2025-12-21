import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';

@immutable
class AppTokens extends ThemeExtension<AppTokens> {
  const AppTokens({
    required this.seedColor,
    required this.spacingS,
    required this.spacingM,
    required this.spacingL,
    required this.radiusM,
  });

  final Color seedColor;
  final double spacingS;
  final double spacingM;
  final double spacingL;
  final double radiusM;

  static const AppTokens light = AppTokens(
    seedColor: Color(0xFF00897B),
    spacingS: 8,
    spacingM: 16,
    spacingL: 24,
    radiusM: 12,
  );

  static const AppTokens dark = AppTokens(
    seedColor: Color(0xFF00897B),
    spacingS: 8,
    spacingM: 16,
    spacingL: 24,
    radiusM: 12,
  );

  @override
  AppTokens copyWith({
    Color? seedColor,
    double? spacingS,
    double? spacingM,
    double? spacingL,
    double? radiusM,
  }) {
    return AppTokens(
      seedColor: seedColor ?? this.seedColor,
      spacingS: spacingS ?? this.spacingS,
      spacingM: spacingM ?? this.spacingM,
      spacingL: spacingL ?? this.spacingL,
      radiusM: radiusM ?? this.radiusM,
    );
  }

  @override
  AppTokens lerp(ThemeExtension<AppTokens>? other, double t) {
    if (other is! AppTokens) return this;
    return AppTokens(
      seedColor: Color.lerp(seedColor, other.seedColor, t) ?? seedColor,
      spacingS: lerpDouble(spacingS, other.spacingS, t) ?? spacingS,
      spacingM: lerpDouble(spacingM, other.spacingM, t) ?? spacingM,
      spacingL: lerpDouble(spacingL, other.spacingL, t) ?? spacingL,
      radiusM: lerpDouble(radiusM, other.radiusM, t) ?? radiusM,
    );
  }
}

extension AppTokensX on BuildContext {
  AppTokens get tokens =>
      Theme.of(this).extension<AppTokens>() ?? AppTokens.light;
}
