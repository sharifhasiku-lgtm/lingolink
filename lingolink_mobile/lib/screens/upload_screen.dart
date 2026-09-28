import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../services/api_service.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});
  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  File? _file;
  String _sourceLang = 'eng_Latn';
  String _targetLang = 'fra_Latn';
  bool _loading = false;
  String? _error;
  String _sourceText = '';
  String _translatedText = '';

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

  Future<void> _pick() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: <String>['wav', 'mp3', 'm4a', 'mp4', 'mov', 'webm'],
    );
    if (result != null && result.files.single.path != null) {
      setState(() {
        _file = File(result.files.single.path!);
        _error = null;
        _sourceText = '';
        _translatedText = '';
      });
    }
  }

  Future<void> _upload() async {
    if (_file == null) return;
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.translateAudio(
        file: _file!,
        sourceLang: _sourceLang,
        targetLang: _targetLang,
      );
      setState(() {
        _sourceText = (data['source_text'] ?? '').toString();
        _translatedText = (data['translated_text'] ?? '').toString();
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Upload Audio / Video')),
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
            SizedBox(
              height: 56,
              child: OutlinedButton.icon(
                onPressed: _loading ? null : _pick,
                icon: const Icon(Icons.attach_file),
                label: Text(_file == null ? 'Choose audio/video file' : _file!.path.split(RegExp(r'[\\/]')).last, overflow: TextOverflow.ellipsis),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: (_file == null || _loading) ? null : _upload,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF667eea), foregroundColor: Colors.white),
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Upload & Translate', style: TextStyle(fontSize: 16)),
              ),
            ),
            if (_error != null) ...<Widget>[
              const SizedBox(height: 16),
              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            ],
            if (_sourceText.isNotEmpty) ...<Widget>[
              const SizedBox(height: 24),
              const Text('Transcript:', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              SelectableText(_sourceText),
              const SizedBox(height: 16),
              const Text('Translation:', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.greenAccent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: SelectableText(_translatedText, style: const TextStyle(fontSize: 16)),
              ),
            ],
            const SizedBox(height: 24),
            const Text(
              'Note: video files must have audio. Only short clips (<30s) recommended on free tier.',
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