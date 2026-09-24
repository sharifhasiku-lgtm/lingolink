import 'package:flutter/material.dart';
import 'screens/landing_screen.dart';

void main() {
  runApp(const LingoLinkApp());
}

class LingoLinkApp extends StatelessWidget {
  const LingoLinkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LingoLink AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF667eea),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF0F0F1E),
      ),
      home: const LandingScreen(),
    );
  }
}
