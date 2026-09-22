import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as ws_status;

class WebSocketService {
  WebSocketChannel? _channel;
  final StreamController<Map<String, dynamic>> _messageController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<bool> _connectionController =
      StreamController<bool>.broadcast();

  Stream<Map<String, dynamic>> get messages => _messageController.stream;
  Stream<bool> get connectionState => _connectionController.stream;
  bool get isConnected => _channel != null;

  Future<void> connect(String wsUrl) async {
    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrl));
      await _channel!.ready;
      _connectionController.add(true);

      _channel!.stream.listen(
        (dynamic data) {
          try {
            final Map<String, dynamic> parsed =
                jsonDecode(data as String) as Map<String, dynamic>;
            _messageController.add(parsed);
          } catch (e) {
            print('WebSocket parse error: $e');
          }
        },
        onError: (Object e) {
          print('WebSocket error: $e');
          _connectionController.add(false);
        },
        onDone: () {
          _connectionController.add(false);
          _channel = null;
        },
      );
    } catch (e) {
      print('WebSocket connect failed: $e');
      _connectionController.add(false);
    }
  }

  void send(Map<String, dynamic> data) {
    if (_channel != null) {
      _channel!.sink.add(jsonEncode(data));
    }
  }

  void startCall(String callId, String targetLang) {
    send(<String, dynamic>{
      'type': 'call_start',
      'call_id': callId,
      'target_lang': targetLang,
    });
  }

  void sendAudioChunk(String base64Audio) {
    send(<String, dynamic>{
      'type': 'audio_chunk',
      'speaker': 'caller',
      'audio': base64Audio,
      'mime': 'audio/wav',
    });
  }

  void endCall(String callId) {
    send(<String, dynamic>{'type': 'call_end', 'call_id': callId});
  }

  Future<void> disconnect() async {
    await _channel?.sink.close(ws_status.normalClosure);
    _channel = null;
    _connectionController.add(false);
  }

  void dispose() {
    _messageController.close();
    _connectionController.close();
    _channel?.sink.close();
  }
}