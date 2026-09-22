import 'package:just_audio/just_audio.dart';

class PlaybackService {
  final AudioPlayer _player = AudioPlayer();
  bool _enabled = true;

  bool get enabled => _enabled;

  void toggleMute() {
    _enabled = !_enabled;
    if (!_enabled) {
      stop();
    }
  }

  Future<void> playUrl(String url) async {
    if (!_enabled) return;
    try {
      await _player.setUrl(url);
      await _player.play();
    } catch (e) {
      print('Playback error: $e');
    }
  }

  Future<void> stop() async {
    await _player.stop();
  }

  void dispose() {
    _player.dispose();
  }
}