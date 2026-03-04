import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:io';

class ApiService {
  // Use 10.0.2.2 for Android emulator, localhost for iOS simulator/web
  static const String baseUrl = 'http://10.0.2.2:3000';

  static Future<String> getDeviceId() async {
    var deviceInfo = DeviceInfoPlugin();
    if (Platform.isIOS) {
      var iosDeviceInfo = await deviceInfo.iosInfo;
      return iosDeviceInfo.identifierForVendor ?? 'unknown_ios';
    } else if (Platform.isAndroid) {
      var androidDeviceInfo = await deviceInfo.androidInfo;
      return androidDeviceInfo.id; 
    }
    return 'unknown_device';
  }

  static Future<String?> getAuthToken() async {
    User? user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      return await user.getIdToken();
    }
    return null;
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getAuthToken();
    final headers = {'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<dynamic> _fetch(String endpoint) async {
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: await _headers(),
    );
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      throw Exception('API Error: ${response.statusCode} - ${response.body}');
    }
  }

  // Dashboard & Reports
  static Future<Map<String, dynamic>> fetchDashboardStats() async {
    return await _fetch('/reports/stats');
  }

  static Future<List<dynamic>> fetchReports() async {
    return await _fetch('/reports');
  }

  static Future<Map<String, dynamic>> fetchReportById(String id) async {
    return await _fetch('/reports/$id');
  }

  // Practices
  static Future<bool> startFreeVoiceInterview() async {
    final deviceId = await getDeviceId();
    final response = await http.post(
      Uri.parse('$baseUrl/interview/start-voice'),
      headers: await _headers(),
      body: jsonEncode({'deviceId': deviceId}),
    );
    if (response.statusCode == 201 || response.statusCode == 200) return true;
    throw Exception(jsonDecode(response.body)['message'] ?? 'Voice limit reached');
  }

  static Future<bool> startPremiumVideoInterview() async {
    final token = await getAuthToken();
    if (token == null) throw Exception('User not logged in');
    final response = await http.post(
      Uri.parse('$baseUrl/interview/start-video'),
      headers: await _headers(),
    );
    if (response.statusCode == 201 || response.statusCode == 200) return true;
    throw Exception(jsonDecode(response.body)['message'] ?? 'Video limit reached');
  }

  static Future<void> processInterviewMetrics({
    required Map<String, dynamic> clientSideMetrics,
    String domain = 'General',
    String? subtopic,
    String? customPrompt,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/interview/process-metrics'),
      headers: await _headers(),
      body: jsonEncode({
        'metrics': clientSideMetrics,
        'domain': domain,
        'subtopic': subtopic,
        'customPrompt': customPrompt
      }),
    );
    if (response.statusCode >= 400) {
      throw Exception('Failed to process metrics: ${response.body}');
    }
  }
}
