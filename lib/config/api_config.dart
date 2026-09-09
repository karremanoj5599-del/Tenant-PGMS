import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConfig {
  ApiConfig._();

  static String get baseUrl {
    const envUrl = String.fromEnvironment('API_URL', defaultValue: '');

    if (envUrl.isNotEmpty) {
      return envUrl.replaceAll(RegExp(r'/tenant/?$'), '');
    }

    // Production URL
    return 'https://pgms-nu.vercel.app/api/tenant';
  }

  /// Local development fallback
  static String get localBaseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:3001/api/tenant';
    }
    return 'http://127.0.0.1:3001/api/tenant';
  }
}
