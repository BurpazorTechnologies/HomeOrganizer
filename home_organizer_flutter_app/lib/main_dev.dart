import 'package:flutter/material.dart';
import 'package:home_organizer_flutter_app/app/home_organizer_app.dart';
import 'package:home_organizer_flutter_app/config/app_config.dart';
import 'package:home_organizer_flutter_app/config/dev.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  AppConfig.set(devConfig);
  runApp(const HomeOrganizerApp());
}


