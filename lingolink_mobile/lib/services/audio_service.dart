import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:record/record.dart';

class AudioService {
  final AudioRecorder _recorder = AudioRecorder();
  StreamSubscription<Uint8List>? _streamSub;
  final StreamController<Uint8List> _chunkController =
      StreamController<Uint8List>.broadcast();

  Stream<Uint8List> get audioChunks => _chunkController.stream;

  Future<bool> requestMicPermission() async {
    // `record` handles permission prompts internally on most platforms
    return await _recorder.hasPermission();
  }

  Future<bool> startStreaming() async {
    if (!await _recorder.hasPermission()) {
      return false;
    }

    final Stream<Uint8List> stream = await _recorder.startStream(
      const RecordConfig(
        encoder: AudioEncoder.pcm16bits,
        sampleRate: 16000,
        numChannels: 1,
        bitRate: 256000,
      ),
    );

    _streamSub = stream.listen((Uint8List chunk) {
      _chunkController.add(chunk);
    });

    return true;
  }

  Future<void> stopStreaming() async {
    await _streamSub?.cancel();
    _streamSub = null;
    await _recorder.stop();
  }

  static String pcmToBase64Wav(Uint8List pcmBytes) {
    final Uint8List wav = _wrapPcmAsWav(pcmBytes);
    return base64Encode(wav);
  }

  static Uint8List _wrapPcmAsWav(Uint8List pcm) {
    const int sampleRate = 16000;
    const int numChannels = 1;
    const int bitsPerSample = 16;
    final int byteRate = sampleRate * numChannels * bitsPerSample ~/ 8;
    final int blockAlign = numChannels * bitsPerSample ~/ 8;
    final int dataLength = pcm.length;
    final int fileLength = 36 + dataLength;

    final BytesBuilder header = BytesBuilder();
    header.add(utf8.encode('RIFF'));
    header.add(_uint32LE(fileLength));
    header.add(utf8.encode('WAVE'));
    header.add(utf8.encode('fmt '));
    header.add(_uint32LE(16));
    header.add(_uint16LE(1));
    header.add(_uint16LE(numChannels));
    header.add(_uint32LE(sampleRate));
    header.add(_uint32LE(byteRate));
    header.add(_uint16LE(blockAlign));
    header.add(_uint16LE(bitsPerSample));
    header.add(utf8.encode('data'));
    header.add(_uint32LE(dataLength));
    header.add(pcm);

    return header.toBytes();
  }

  static List<int> _uint32LE(int v) {
    return <int>[
      v & 0xFF,
      (v >> 8) & 0xFF,
      (v >> 16) & 0xFF,
      (v >> 24) & 0xFF,
    ];
  }

  static List<int> _uint16LE(int v) {
    return <int>[v & 0xFF, (v >> 8) & 0xFF];
  }

  void dispose() {
    _chunkController.close();
    _recorder.dispose();
  }
}