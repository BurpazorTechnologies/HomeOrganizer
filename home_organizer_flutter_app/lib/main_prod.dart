import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_organizer_flutter_app/app/home_organizer_app.dart';
import 'package:home_organizer_flutter_app/config/app_config.dart';
import 'package:home_organizer_flutter_app/config/prod.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  AppConfig.set(prodConfig);
  runApp(const ProviderScope(child: HomeOrganizerApp()));
}
