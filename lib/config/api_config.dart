import 'package:flutter/foundation.dart' show kDebugMode;

class ApiConfig {
  ApiConfig._();

  static String get baseUrl {
    const envUrl = String.fromEnvironment('API_URL', defaultValue: '');

    if (envUrl.isNotEmpty) {
      final clean = envUrl.replaceAll(RegExp(r'/+$'), '');
      return clean.endsWith('/tenant') ? clean : '$clean/tenant';
    }

    // In debug mode, connect to your PC's local Wi-Fi IP on port 5000
    // This works both wirelessly over Wi-Fi and via USB!
    if (kDebugMode) {
      return 'http://192.168.1.106:5000/api/tenant';
    }

    // Production URL
    return 'https://pgms-nu.vercel.app/api/tenant';
  }

  /// Local development fallback
  static String get localBaseUrl => 'http://192.168.1.106:5000/api/tenant';
}
