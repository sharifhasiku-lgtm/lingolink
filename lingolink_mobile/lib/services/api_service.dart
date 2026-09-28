import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://lingolink-backend-zur3.onrender.com';
  static const String _tokenKey = 'lingolink_token';
  static const String _userKey = 'lingolink_user';

  static String? _token;
  static Map<String, dynamic>? _user;

  static String? get token => _token;
  static Map<String, dynamic>? get user => _user;

  /// Load token from storage on app start
  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    final userJson = prefs.getString(_userKey);
    if (userJson != null) {
      _user = jsonDecode(userJson) as Map<String, dynamic>;
    }
  }

  static Future<void> _saveSession(String token, Map<String, dynamic> user) async {
    _token = token;
    _user = user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user));
  }

  static Future<void> logout() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  static Map<String, String> _authHeaders({bool json = false}) {
    final h = <String, String>{};
    if (json) h['Content-Type'] = 'application/json';
    if (_token != null) h['Authorization'] = 'Bearer $_token';
    return h;
  }

  // ---------- AUTH ----------

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final resp = await http.post(
      Uri.parse('$baseUrl/auth/login/'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    if (resp.statusCode != 200 || data['access_token'] == null) {
      throw Exception(data['detail']?.toString() ?? 'Login failed');
    }
    await _saveSession(data['access_token'] as String, data['user'] as Map<String, dynamic>);
    return data;
  }

  static Future<Map<String, dynamic>> signup(String name, String email, String password) async {
    final resp = await http.post(
      Uri.parse('$baseUrl/auth/signup/'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    if (resp.statusCode != 200 || data['access_token'] == null) {
      throw Exception(data['detail']?.toString() ?? 'Signup failed');
    }
    await _saveSession(data['access_token'] as String, data['user'] as Map<String, dynamic>);
    return data;
  }

  // ---------- TRANSLATE TEXT ----------

  static Future<Map<String, dynamic>> translateText({
    required String text,
    required String sourceLang,
    required String targetLang,
  }) async {
    final resp = await http.post(
      Uri.parse('$baseUrl/translate_text/'),
      headers: _authHeaders(json: true),
      body: jsonEncode({
        'text': text,
        'source_lang': sourceLang,
        'target_lang': targetLang,
      }),
    );
    if (resp.statusCode != 200) {
      throw Exception('Translation failed: HTTP ${resp.statusCode} - ${resp.body}');
    }
    return jsonDecode(resp.body) as Map<String, dynamic>;
  }

  // ---------- TRANSLATE AUDIO (upload file) ----------

  static Future<Map<String, dynamic>> translateAudio({
    required File file,
    required String sourceLang,
    required String targetLang,
  }) async {
    final uri = Uri.parse('$baseUrl/translate_audio/');
    final request = http.MultipartRequest('POST', uri);
    request.headers.addAll(_authHeaders());
    request.fields['source_lang'] = sourceLang;
    request.fields['target_lang'] = targetLang;
    request.files.add(await http.MultipartFile.fromPath('file', file.path));

    final streamed = await request.send().timeout(const Duration(minutes: 5));
    final resp = await http.Response.fromStream(streamed);
    if (resp.statusCode != 200) {
      throw Exception('Upload failed: HTTP ${resp.statusCode} - ${resp.body}');
    }
    return jsonDecode(resp.body) as Map<String, dynamic>;
  }
}