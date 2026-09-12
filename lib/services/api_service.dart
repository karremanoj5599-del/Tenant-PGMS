import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/tenant.dart';
import '../models/billing.dart';
import '../models/payment.dart';
import '../models/ticket.dart';
import '../models/visitor.dart';
import '../models/menu_item.dart';
import '../models/mess_history.dart';
import '../models/log_entry.dart';
import '../models/notification.dart';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;

  ApiResponse({required this.success, this.data, this.error});
}

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService({String? baseUrl}) => _instance;
  ApiService._internal();

  static String? _tenantIdToken;
  static String? _userId;

  String get _baseUrl => ApiConfig.baseUrl;

  void setAuthToken(String? token, {String? userId}) {
    _tenantIdToken = token;
    if (userId != null && userId.isNotEmpty) {
      _userId = userId;
    }
  }

  Map<String, String> _headers() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (_userId != null && _userId!.isNotEmpty) {
      headers['x-user-id'] = _userId!;
    }
    if (_tenantIdToken != null && _tenantIdToken!.isNotEmpty) {
      headers['x-tenant-id'] = _tenantIdToken!;
    }
    return headers;
  }

  // ─── HEALTH & CONNECTIVITY ─────────────────────────────────
  Future<ApiResponse<bool>> checkConnection() async {
    try {
      final response = await http
          .get(Uri.parse('$_baseUrl/health'))
          .timeout(const Duration(seconds: 4));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(success: true, data: true);
      }
      return ApiResponse(
        success: false,
        error: 'Server returned HTTP ${response.statusCode}',
      );
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Cannot reach server at $_baseUrl ($e)',
      );
    }
  }

  // ─── AUTH ──────────────────────────────────────────────────
  Future<ApiResponse<Map<String, dynamic>>> login(String mobile, String password) async {
    try {
      final formattedMobile = mobile.trim().startsWith('+') ? mobile.trim() : '+91${mobile.trim()}';
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'mobile': formattedMobile, 'password': password}),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300 && (body['success'] == true || body['token'] != null)) {
        final token = body['token']?.toString() ?? '';
        final tenantJson = body['tenant'] is Map ? (body['tenant'] as Map<String, dynamic>) : <String, dynamic>{};
        final userId = tenantJson['user_id']?.toString();
        setAuthToken(token, userId: userId);
        final tenant = TenantInfo.fromJson(tenantJson);
        return ApiResponse(
          success: true,
          data: {'token': token, 'tenant': tenant},
        );
      } else {
        return ApiResponse(
          success: false,
          error: body['error'] ?? body['message'] ?? 'Invalid credentials.',
        );
      }
    } catch (e) {
      debugPrint('Tenant login error: $e');
      return ApiResponse(
        success: false,
        error: 'CONNECTION_ERROR: Could not connect to server at $_baseUrl. Please verify the server is running.',
      );
    }
  }

  Future<ApiResponse<String>> updatePin(String oldPin, String newPin) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/auth/update-pin'),
        headers: _headers(),
        body: jsonEncode({'oldPin': oldPin, 'newPin': newPin}),
      );
      final body = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(success: true, data: body['message'] ?? 'PIN updated successfully.');
      }
      return ApiResponse(success: false, error: body['error'] ?? 'Failed to update PIN.');
    } catch (e) {
      return ApiResponse(success: false, error: 'Network error updating PIN.');
    }
  }

  Future<ApiResponse<String>> submitVacateNotice(String vacateDate) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/vacate'),
        headers: _headers(),
        body: jsonEncode({'vacateDate': vacateDate}),
      );
      final body = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(success: true, data: body['message'] ?? 'Notice submitted successfully.');
      }
      return ApiResponse(success: false, error: body['error'] ?? 'Failed to submit notice.');
    } catch (e) {
      return ApiResponse(success: false, error: 'Network error submitting notice.');
    }
  }

  // ─── DASHBOARD ─────────────────────────────────────────────
  Future<Map<String, dynamic>?> getDashboard() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/dashboard/overview'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          return decoded;
        }
      } else {
        debugPrint('Dashboard HTTP error: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      debugPrint('Get dashboard error: $e');
    }
    return null;
  }

  // ─── PAYMENTS & BILLING ────────────────────────────────────
  Future<Billing?> getBilling() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/payments/billing'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final body = jsonDecode(response.body);
        if (body is Map && body['history'] is List && (body['history'] as List).isNotEmpty) {
          return Billing.fromJson((body['history'] as List).first as Map<String, dynamic>);
        } else if (body is Map && body['billing'] is Map) {
          return Billing.fromJson(body['billing'] as Map<String, dynamic>);
        } else if (body is Map<String, dynamic>) {
          return Billing.fromJson(body);
        }
      }
    } catch (e) {
      debugPrint('Get billing error: $e');
    }
    return null;
  }

  Future<List<Payment>> getPaymentHistory() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/payments/history'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final body = jsonDecode(response.body);
        final List list = body is Map && body['history'] is List
            ? (body['history'] as List)
            : (body is List ? body : []);
        return list
            .whereType<Map<String, dynamic>>()
            .map((e) => Payment.fromJson(e))
            .toList();
      }
    } catch (e) {
      debugPrint('Get payment history error: $e');
    }
    return [];
  }

  Future<ApiResponse<String>> recordPayment({
    required double amount,
    required String month,
    required int year,
    String? paymentMethod,
    String? transactionId,
  }) async {
    try {
      final payload = <String, dynamic>{
        'amount': amount,
        'month': month,
        'year': year,
      };
      if (paymentMethod != null) payload['payment_method'] = paymentMethod;
      if (transactionId != null) payload['transaction_id'] = transactionId;

      final response = await http.post(
        Uri.parse('$_baseUrl/payments/record'),
        headers: _headers(),
        body: jsonEncode(payload),
      );
      final body = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(success: true, data: body['message'] ?? 'Payment recorded.');
      }
      return ApiResponse(success: false, error: body['error'] ?? 'Payment recording failed.');
    } catch (e) {
      return ApiResponse(success: false, error: 'Network error recording payment.');
    }
  }

  // ─── TICKETS ───────────────────────────────────────────────
  Future<List<Ticket>> getTickets() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/tickets'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final body = jsonDecode(response.body);
        final List list = body is Map && body['tickets'] is List
            ? (body['tickets'] as List)
            : (body is List ? body : []);
        return list
            .whereType<Map<String, dynamic>>()
            .map((e) => Ticket.fromJson(e))
            .toList();
      }
    } catch (e) {
      debugPrint('Get tickets error: $e');
    }
    return [];
  }

  Future<bool> createTicket(String category, String description) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tickets'),
        headers: _headers(),
        body: jsonEncode({'category': category, 'description': description}),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      debugPrint('Create ticket error: $e');
      return false;
    }
  }

  Future<bool> rateTicket(int id, int rating, String? feedback) async {
    try {
      final payload = <String, dynamic>{
        'rating': rating,
      };
      if (feedback != null) payload['feedback'] = feedback;

      final response = await http.put(
        Uri.parse('$_baseUrl/tickets/$id/rate'),
        headers: _headers(),
        body: jsonEncode(payload),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      debugPrint('Rate ticket error: $e');
      return false;
    }
  }

  // ─── ACCESS LOGS ───────────────────────────────────────────
  Future<Map<String, dynamic>> getAccessLogsReport({int limit = 100, int offset = 0}) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/logs?limit=$limit&offset=$offset'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final body = jsonDecode(response.body);
        if (body is Map<String, dynamic>) {
          final List rawLogs = (body['logs'] as List?) ?? [];
          final List rawDays = (body['day_summary'] as List?) ?? [];
          return {
            'logs': rawLogs.whereType<Map<String, dynamic>>().map((e) => LogEntry.fromJson(e)).toList(),
            'day_summary': rawDays.whereType<Map<String, dynamic>>().map((e) => DayLogReport.fromJson(e)).toList(),
          };
        }
      }
    } catch (e) {
      debugPrint('Get logs report error: $e');
    }
    return {'logs': <LogEntry>[], 'day_summary': <DayLogReport>[]};
  }

  Future<List<LogEntry>> getAccessLogs({int limit = 50, int offset = 0}) async {
    final report = await getAccessLogsReport(limit: limit, offset: offset);
    return (report['logs'] as List<LogEntry>?) ?? [];
  }

  // ─── MESS / FOOD ───────────────────────────────────────────
  Future<List<MenuItem>> getMessMenu() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/mess/menu'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final body = jsonDecode(response.body);
        final List list = body is Map && body['menu'] is List
            ? (body['menu'] as List)
            : (body is List ? body : []);
        return list
            .whereType<Map<String, dynamic>>()
            .map((e) => MenuItem.fromJson(e))
            .toList();
      }
    } catch (e) {
      debugPrint('Get mess menu error: $e');
    }
    return [];
  }

  Future<bool> toggleMealOptOut(String id, bool optedOut) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/mess/opt-out'),
        headers: _headers(),
        body: jsonEncode({'id': id, 'optedOut': optedOut}),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      debugPrint('Toggle opt out error: $e');
      return true; // optimistic
    }
  }

  Future<Map<String, dynamic>> scanMessQR(String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/mess/scan'),
        headers: _headers(),
        body: jsonEncode({'user_id': userId}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      debugPrint('Mess QR scan error: $e');
      return {'success': false, 'error': 'Failed to scan meal token.'};
    }
  }

  Future<List<MessHistoryItem>> getMessHistory() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/mess/history'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final body = jsonDecode(response.body);
        final List list = body is Map && body['history'] is List
            ? (body['history'] as List)
            : (body is List ? body : []);
        return list
            .whereType<Map<String, dynamic>>()
            .map((e) => MessHistoryItem.fromJson(e))
            .toList();
      }
    } catch (e) {
      debugPrint('Get mess history error: $e');
    }
    return [];
  }

  // ─── VISITORS ──────────────────────────────────────────────
  Future<List<Visitor>> getVisitors() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/visitors'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final body = jsonDecode(response.body);
        final List list = body is Map && body['visitors'] is List
            ? (body['visitors'] as List)
            : (body is List ? body : []);
        return list
            .whereType<Map<String, dynamic>>()
            .map((e) => Visitor.fromJson(e))
            .toList();
      }
    } catch (e) {
      debugPrint('Get visitors error: $e');
    }
    return [];
  }

  Future<ApiResponse<String>> inviteVisitor({
    required String name,
    required String phone,
    required String date,
    required String purpose,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/visitors'),
        headers: _headers(),
        body: jsonEncode({
          'name': name,
          'phone': phone,
          'visit_date': date,
          'purpose': purpose,
        }),
      );
      final body = jsonDecode(response.body);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(success: true, data: body['message'] ?? 'Visitor pass generated.');
      }
      return ApiResponse(success: false, error: body['error'] ?? 'Failed to invite visitor.');
    } catch (e) {
      return ApiResponse(success: false, error: 'Network error generating pass.');
    }
  }

  // ─── NOTIFICATIONS ─────────────────────────────────────────
  Future<List<InAppNotification>> getNotifications() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/notifications'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final body = jsonDecode(response.body);
        final List list = body is Map && body['data'] is List
            ? (body['data'] as List)
            : (body is Map && body['notifications'] is List
                ? (body['notifications'] as List)
                : (body is List ? body : []));
        return list
            .whereType<Map<String, dynamic>>()
            .map((e) => InAppNotification.fromJson(e))
            .toList();
      }
    } catch (e) {
      debugPrint('Get notifications error: $e');
    }
    return [];
  }

  Future<bool> markNotificationRead(int id) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/notifications/$id/read'),
        headers: _headers(),
      );
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      debugPrint('Mark notification read error: $e');
      return true; // optimistic
    }
  }
}
