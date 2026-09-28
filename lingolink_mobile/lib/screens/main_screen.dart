import 'package:flutter/material.dart';
import 'translator_screen.dart';
import 'text_translate_screen.dart';
import 'upload_screen.dart';
import 'login_screen.dart';
import '../services/api_service.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});
  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _index = 0;

  final List<Widget> _pages = const <Widget>[
    TranslatorScreen(),
    TextTranslateScreen(),
    UploadScreen(),
  ];

  Future<void> _logout() async {
    await ApiService.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const <NavigationDestination>[
          NavigationDestination(icon: Icon(Icons.mic), label: 'Audio'),
          NavigationDestination(icon: Icon(Icons.text_fields), label: 'Text'),
          NavigationDestination(icon: Icon(Icons.upload_file), label: 'Upload'),
        ],
      ),
      floatingActionButton: FloatingActionButton.small(
        onPressed: _logout,
        tooltip: 'Logout',
        child: const Icon(Icons.logout),
      ),
    );
  }
}