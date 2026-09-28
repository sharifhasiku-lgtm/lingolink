import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TextTranslateScreen extends StatefulWidget {
  const TextTranslateScreen({super.key});
  @override
  State<TextTranslateScreen> createState() => _TextTranslateScreenState();
}

class _TextTranslateScreenState extends State<TextTranslateScreen> {
  final _input = TextEditingController();
  String _sourceLang = 'eng_Latn';
  String _targetLang = 'fra_Latn';
  String _result = '';
  bool _loading = false;
  String? _error;

  // Backend-supported pairs (light models)
  static const List<Map<String, String>> _langs = <Map<String, String>>[
    {'code': 'eng_Latn', 'name': 'English 🇬🇧'},
    {'code': 'fra_Latn', 'name': 'French 🇫🇷'},
    {'code': 'spa_Latn', 'name': 'Spanish 🇪🇸'},
    {'code': 'deu_Latn', 'name': 'German 🇩🇪'},
    {'code': 'ita_Latn', 'name': 'Italian 🇮🇹'},
    {'code': 'por_Latn', 'name': 'Portuguese 🇵🇹'},
    {'code': 'rus_Cyrl', 'name': 'Russian 🇷🇺'},
    {'code': 'arb_Arab', 'name': 'Arabic 🇸🇦'},
    {'code': 'hin_Deva', 'name': 'Hindi 🇮🇳'},
    {'code': 'zho_Hans', 'name': 'Chinese 🇨🇳'},
    {'code': 'nld_Latn', 'name': 'Dutch 🇳🇱'},
    {'code': 'swh_Latn', 'name': 'Swahili 🇹🇿'},
  ];

  Future<void> _translate() async {
    final text = _input.text.trim();
    if (text.isEmpty) return;
    setState(() { _loading = true; _error = null; _result = ''; });
    try {
      final data = await ApiService.translateText(
        text: text,
        sourceLang: _sourceLang,
        targetLang: _targetLang,
      );
      setState(() => _result = (data['translated_text'] ?? '').toString());
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Text Translation')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(child: _langDropdown('From', _sourceLang, (v) => setState(() => _sourceLang = v))),
                const SizedBox(width: 8),
                Expanded(child: _langDropdown('To', _targetLang, (v) => setState(() => _targetLang = v))),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _input,
              maxLines: 5,
              decoration: const InputDecoration(
                hintText: 'Enter text to translate...',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: _loading ? null : _translate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF667eea),
                  foregroundColor: Colors.white,
                ),
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Translate', style: TextStyle(fontSize: 16)),
              ),
            ),
            if (_error != null) ...<Widget>[
              const SizedBox(height: 16),
              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            ],
            if (_result.isNotEmpty) ...<Widget>[
              const SizedBox(height: 24),
              const Text('Translation:', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.greenAccent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.greenAccent.withValues(alpha: 0.4)),
                ),
                child: SelectableText(_result, style: const TextStyle(fontSize: 16)),
              ),
            ],
            const SizedBox(height: 24),
            const Text(
              'Note: only English ↔ {French, Spanish, German, Italian, Portuguese, Russian, Arabic, Hindi, Chinese, Dutch, Swahili} pairs are supported by the current backend.',
              style: TextStyle(fontSize: 11, color: Colors.white54),
            ),
          ],
        ),
      ),
    );
  }

  Widget _langDropdown(String label, String value, ValueChanged<String> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.white54)),
        const SizedBox(height: 4),
        DropdownButtonFormField<String>(
          initialValue: value,
          isExpanded: true,
          decoration: const InputDecoration(border: OutlineInputBorder(), contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8)),
          items: _langs.map((l) => DropdownMenuItem<String>(value: l['code'], child: Text(l['name']!, overflow: TextOverflow.ellipsis))).toList(),
          onChanged: (v) { if (v != null) onChanged(v); },
        ),
      ],
    );
  }
}