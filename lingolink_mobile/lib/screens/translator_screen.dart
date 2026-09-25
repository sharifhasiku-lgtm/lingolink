import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../services/audio_service.dart';
import '../services/playback_service.dart';
import '../services/websocket_service.dart';

class TranslatorScreen extends StatefulWidget {
  const TranslatorScreen({super.key});

  @override
  State<TranslatorScreen> createState() => _TranslatorScreenState();
}

class _TranslatorScreenState extends State<TranslatorScreen> {
      static const String _wsUrl = 'wss://lingolink-backend-zur3.onrender.com/ws/agent';

  final WebSocketService _ws = WebSocketService();
  final AudioService _audio = AudioService();
  final PlaybackService _playback = PlaybackService();

  bool _connected = false;
  bool _recording = false;
  String _targetLang = 'eng_Latn';
  final List<_Line> _lines = <_Line>[];
  StreamSubscription<Uint8List>? _audioSub;
  final ScrollController _scrollController = ScrollController();

  static const List<Map<String, String>> _langs = <Map<String, String>>[
    <String, String>{'code': 'eng_Latn', 'name': 'English'},
    <String, String>{'code': 'swh_Latn', 'name': 'Swahili'},
    <String, String>{'code': 'fra_Latn', 'name': 'French'},
    <String, String>{'code': 'spa_Latn', 'name': 'Spanish'},
    <String, String>{'code': 'deu_Latn', 'name': 'German'},
    <String, String>{'code': 'arb_Arab', 'name': 'Arabic'},
    <String, String>{'code': 'zho_Hans', 'name': 'Chinese'},
    <String, String>{'code': 'hin_Deva', 'name': 'Hindi'},
  ];

  @override
  void initState() {
    super.initState();
    _ws.connectionState.listen((bool c) {
      if (mounted) setState(() => _connected = c);
    });
    _ws.messages.listen(_handleMessage);
    _ws.connect(_wsUrl);
  }

  void _handleMessage(Map<String, dynamic> data) {
    final String type = (data['type'] ?? '') as String;
    if (type == 'transcript' || type == 'system') {
      setState(() {
        _lines.add(_Line(
          speaker: (data['speaker'] ?? 'caller') as String,
          text: (data['text'] ?? '') as String,
        ));
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _startRecording() async {
    final bool granted = await _audio.requestMicPermission();
    if (!granted) {
      _showSnack('Microphone permission denied');
      return;
    }

    if (!_connected) {
      _showSnack('Not connected to backend');
      return;
    }

    final String callId =
        'mobile-${DateTime.now().millisecondsSinceEpoch}';
    _ws.startCall(callId, _targetLang);

    final bool ok = await _audio.startStreaming();
    if (!ok) {
      _showSnack('Failed to start microphone');
      return;
    }

    final BytesBuilder buffer = BytesBuilder();
    _audioSub = _audio.audioChunks.listen((Uint8List chunk) {
      buffer.add(chunk);
      // ~4 seconds of 16kHz mono 16-bit PCM
      if (buffer.length >= 16000 * 2 * 4) {
        final Uint8List pcm = buffer.toBytes();
        buffer.clear();
        final String b64 = AudioService.pcmToBase64Wav(pcm);
        _ws.sendAudioChunk(b64);
      }
    });

    setState(() => _recording = true);
  }

  Future<void> _stopRecording() async {
    await _audioSub?.cancel();
    _audioSub = null;
    await _audio.stopStreaming();
    setState(() => _recording = false);
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  void dispose() {
    _audioSub?.cancel();
    _audio.dispose();
    _playback.dispose();
    _ws.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: <Widget>[
            _buildHeader(),
            Expanded(child: _buildTranscript()),
            _buildPushToTalk(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.2),
        border: Border(
          bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: <Color>[
                      Color(0xFF667eea),
                      Color(0xFF764ba2),
                    ],
                  ),
                ),
                child: const Center(
                  child: Text(
                    'LL',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'LingoLink Mobile',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      'Push-to-talk translator',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white54,
                      ),
                    ),
                  ],
                ),
              ),
              _statusChip(),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: <Widget>[
              const Icon(
                Icons.language,
                size: 16,
                color: Colors.white54,
              ),
              const SizedBox(width: 6),
              const Text(
                'Target:',
                style: TextStyle(fontSize: 12, color: Colors.white54),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _targetLang,
                    dropdownColor: const Color(0xFF1E1E2E),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                    items: _langs.map((Map<String, String> l) {
                      return DropdownMenuItem<String>(
                        value: l['code'],
                        child: Text(l['name'] ?? ''),
                      );
                    }).toList(),
                    onChanged: _recording
                        ? null
                        : (String? v) {
                            if (v != null) {
                              setState(() => _targetLang = v);
                            }
                          },
                  ),
                ),
              ),
              IconButton(
                icon: Icon(
                  _playback.enabled
                      ? Icons.volume_up
                      : Icons.volume_off,
                  color: _playback.enabled
                      ? Colors.greenAccent
                      : Colors.redAccent,
                ),
                onPressed: () {
                  setState(() => _playback.toggleMute());
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statusChip() {
    final Color color = _connected ? Colors.greenAccent : Colors.grey;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(
            _connected ? Icons.wifi : Icons.wifi_off,
            size: 12,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            _connected ? 'Connected' : 'Offline',
            style: TextStyle(color: color, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildTranscript() {
    if (_lines.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Icon(Icons.mic_none, size: 64, color: Colors.white24),
              SizedBox(height: 12),
              Text(
                'Hold the button below and speak',
                style: TextStyle(color: Colors.white54),
              ),
              SizedBox(height: 4),
              Text(
                'Your speech will be translated',
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: _lines.length,
      itemBuilder: (BuildContext context, int i) {
        final _Line line = _lines[i];
        final bool isAgent = line.speaker.startsWith('agent');
        final bool isSystem = line.speaker == 'system';
        final bool isTranslated = line.speaker.endsWith('_translated');

        return Align(
          alignment: isSystem
              ? Alignment.center
              : (isAgent
                  ? Alignment.centerRight
                  : Alignment.centerLeft),
          child: Container(
            margin: const EdgeInsets.symmetric(vertical: 4),
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.8,
            ),
            decoration: BoxDecoration(
              color: isSystem
                  ? Colors.amber.withValues(alpha: 0.15)
                  : (isTranslated
                      ? Colors.greenAccent.withValues(alpha: 0.15)
                      : (isAgent
                          ? const Color(0xFF667eea).withValues(alpha: 0.5)
                          : Colors.white.withValues(alpha: 0.08))),
              borderRadius: BorderRadius.circular(16),
              border: isTranslated
                  ? Border.all(
                      color: Colors.greenAccent.withValues(alpha: 0.4),
                    )
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  _labelFor(line.speaker),
                  style: TextStyle(
                    fontSize: 10,
                    color: isTranslated
                        ? Colors.greenAccent
                        : Colors.white54,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  line.text,
                  style: const TextStyle(fontSize: 15),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _labelFor(String speaker) {
    if (speaker == 'agent') return 'AGENT';
    if (speaker == 'caller') return 'YOU';
    if (speaker == 'agent_translated') return 'AGENT (TRANSLATED)';
    if (speaker == 'caller_translated') return 'YOU (TRANSLATED)';
    return 'SYSTEM';
  }

  Widget _buildPushToTalk() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.3),
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
        ),
      ),
      child: Column(
        children: <Widget>[
          if (_recording)
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: Text(
                'Listening...',
                style: TextStyle(
                  color: Colors.redAccent,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          GestureDetector(
            onLongPressStart: (LongPressStartDetails _) =>
                _startRecording(),
            onLongPressEnd: (LongPressEndDetails _) => _stopRecording(),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: _recording
                      ? const <Color>[
                          Color(0xFFff4444),
                          Color(0xFFcc0000),
                        ]
                      : const <Color>[
                          Color(0xFF667eea),
                          Color(0xFF764ba2),
                        ],
                ),
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: (_recording
                            ? Colors.red
                            : const Color(0xFF667eea))
                        .withValues(alpha: 0.4),
                    blurRadius: _recording ? 40 : 20,
                    spreadRadius: _recording ? 6 : 0,
                  ),
                ],
              ),
              child: Icon(
                _recording ? Icons.mic : Icons.mic_none,
                size: 56,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            _recording ? 'Release to send' : 'Hold to talk',
            style: const TextStyle(fontSize: 14, color: Colors.white70),
          ),
        ],
      ),
    );
  }
}

class _Line {
  final String speaker;
  final String text;
  _Line({required this.speaker, required this.text});
}
