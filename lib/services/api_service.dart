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
  final String _baseUrl;
  String? _tenantIdToken;

  ApiService({String? baseUrl}) : _baseUrl = baseUrl ?? ApiConfig.baseUrl;

  void setAuthToken(String? token) {
    _tenantIdToken = token;
  }

  Map<String, String> _headers() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (_tenantIdToken != null && _tenantIdToken!.isNotEmpty) {
      headers['x-tenant-id'] = _tenantIdToken!;
    }
    return headers;
  }

  // ─── AUTH ──────────────────────────────────────────────────
  Future<ApiResponse<Map<String, dynamic>>> login(String mobile, String password) async {
    try {
      final formattedMobile = mobile.trim().startsWith('+') ? mobile.trim() : '+91${mobile.trim()}';
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'mobile': formattedMobile, 'password': password}),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300 && body['success'] == true) {
        final token = body['token']?.toString() ?? '';
        setAuthToken(token);
        final tenant = TenantInfo.fromJson(body['tenant'] ?? {});
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
      return ApiResponse(success: false, error: 'Could not connect to server.');
    }
  }

  Future<ApiResponse<String>> updatePin(String oldPin, String newPin) async {
    try {
      final response = await http.post(
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
  Future<Map<String, dynamic>> getDashboard() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/dashboard/overview'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Get dashboard error: $e');
    }
    // Mock fallback
    return {
      'tenant': {
        'id': 1,
        'name': 'Rahul Sharma',
        'mobile': '+919876543210',
        'room': '104',
        'bed': 'A',
        'sharing': '2-Sharing',
        'rent': 8500.0,
        'due_date': '2026-08-05',
        'deposit': 17000.0,
        'status': 'Active',
      },
      'billing': {
        'month': 'August',
        'year': 2026,
        'fixed_rent': 8500.0,
        'previous_balance': 0.0,
        'total_due': 8500.0,
        'amount_paid': 0.0,
        'current_balance': 8500.0,
        'due_date': '2026-08-05',
      },
      'notices': [
        {'title': 'Maintenance Schedule', 'body': 'Water tank cleaning this Sunday 10 AM to 2 PM.'},
        {'title': 'Mess Notice', 'body': 'Special feast dinner scheduled for Independence Day.'},
      ],
    };
  }

  // ─── PAYMENTS & BILLING ────────────────────────────────────
  Future<Billing?> getBilling() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/payments/billing'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return Billing.fromJson(jsonDecode(response.body));
      }
    } catch (e) {
      debugPrint('Get billing error: $e');
    }
    return Billing(
      month: 'August',
      year: 2026,
      fixedRent: 8500.0,
      previousBalance: 0.0,
      totalDue: 8500.0,
      amountPaid: 0.0,
      currentBalance: 8500.0,
      dueDate: '2026-08-05',
    );
  }

  Future<List<Payment>> getPaymentHistory() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/payments/history'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List list = jsonDecode(response.body);
        return list.map((e) => Payment.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('Get payment history error: $e');
    }
    return [
      Payment(
        id: 101,
        amount: 8500.0,
        month: 'July',
        year: 2026,
        paymentMethod: 'UPI',
        transactionId: 'UPI2026070500123',
        createdAt: '2026-07-05T11:20:00Z',
        status: 'completed',
      ),
      Payment(
        id: 100,
        amount: 8500.0,
        month: 'June',
        year: 2026,
        paymentMethod: 'UPI',
        transactionId: 'UPI2026060400891',
        createdAt: '2026-06-04T16:45:00Z',
        status: 'completed',
      ),
    ];
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
        final List list = jsonDecode(response.body);
        return list.map((e) => Ticket.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('Get tickets error: $e');
    }
    return [
      Ticket(
        id: 1,
        category: 'Plumbing',
        description: 'Bathroom faucet is leaking continuously.',
        status: 'in_progress',
        createdAt: '2026-08-01T09:30:00Z',
      ),
      Ticket(
        id: 2,
        category: 'Electrical',
        description: 'Ceiling fan making clicking sound on speed 3.',
        status: 'resolved',
        createdAt: '2026-07-22T14:15:00Z',
        rating: 5,
        feedback: 'Fixed quickly, thanks!',
      ),
    ];
  }

  Future<bool> createTicket(String category, String description) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/tickets/create'),
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
  Future<List<LogEntry>> getAccessLogs({int limit = 50, int offset = 0}) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/logs?limit=$limit&offset=$offset'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List list = jsonDecode(response.body);
        return list.map((e) => LogEntry.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('Get logs error: $e');
    }
    return [
      LogEntry(id: 1, type: 'Entry', time: '2026-08-04 19:42', location: 'Main Gate'),
      LogEntry(id: 2, type: 'Exit', time: '2026-08-04 09:15', location: 'Main Gate'),
      LogEntry(id: 3, type: 'Entry', time: '2026-08-03 21:05', location: 'Main Gate'),
      LogEntry(id: 4, type: 'Exit', time: '2026-08-03 08:50', location: 'Main Gate'),
    ];
  }

  // ─── MESS / FOOD ───────────────────────────────────────────
  Future<List<MenuItem>> getMessMenu() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/mess/menu'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List list = jsonDecode(response.body);
        return list.map((e) => MenuItem.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('Get mess menu error: $e');
    }
    return [
      MenuItem(id: 'mon', day: 'Monday', breakfast: 'Idli & Sambar', lunch: 'Rice, Dal, Mixed Veg, Curd', dinner: 'Roti, Paneer Butter Masala, Rice'),
      MenuItem(id: 'tue', day: 'Tuesday', breakfast: 'Poha & Jalebi', lunch: 'Rice, Rajma, Aloo Gobi, Papad', dinner: 'Roti, Egg Curry / Dal Tadka, Rice'),
      MenuItem(id: 'wed', day: 'Wednesday', breakfast: 'Aloo Paratha with Curd', lunch: 'Veg Biryani, Raita, Salan', dinner: 'Roti, Chicken Curry / Chana Masala, Rice'),
      MenuItem(id: 'thu', day: 'Thursday', breakfast: 'Upma & Chutney', lunch: 'Rice, Sambar, Bhindi Fry, Curd', dinner: 'Roti, Veg Kofta, Dal Fry, Rice'),
      MenuItem(id: 'fri', day: 'Friday', breakfast: 'Dosa & Coconut Chutney', lunch: 'Rice, Dal Makhani, Paneer, Salad', dinner: 'Roti, Mixed Dal, Jeera Rice'),
      MenuItem(id: 'sat', day: 'Saturday', breakfast: 'Poori Bhaji', lunch: 'Rice, Chole, Bhature, Raita', dinner: 'Roti, Veg Pulao, Curd'),
      MenuItem(id: 'sun', day: 'Sunday', breakfast: 'Masala Omelette / Bread Butter', lunch: 'Chicken Biryani / Special Veg Thali', dinner: 'Roti, Dal Fry, Rice, Sweet'),
    ];
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
        final List list = jsonDecode(response.body);
        return list.map((e) => MessHistoryItem.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('Get mess history error: $e');
    }
    return [
      MessHistoryItem(id: 1, scanDate: '2026-08-04', scanTime: '20:15', mealType: 'Dinner', rentStatus: 'Paid'),
      MessHistoryItem(id: 2, scanDate: '2026-08-04', scanTime: '13:10', mealType: 'Lunch', rentStatus: 'Paid'),
      MessHistoryItem(id: 3, scanDate: '2026-08-04', scanTime: '08:45', mealType: 'Breakfast', rentStatus: 'Paid'),
    ];
  }

  // ─── VISITORS ──────────────────────────────────────────────
  Future<List<Visitor>> getVisitors() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/visitors'),
        headers: _headers(),
      );
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final List list = jsonDecode(response.body);
        return list.map((e) => Visitor.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('Get visitors error: $e');
    }
    return [
      Visitor(
        id: 1,
        name: 'Amit Verma',
        phone: '+919123456780',
        visitDate: '2026-08-06',
        purpose: 'Friend visiting for project work',
        status: 'approved',
        passCode: '482910',
      ),
    ];
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
        final List list = jsonDecode(response.body);
        return list.map((e) => InAppNotification.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('Get notifications error: $e');
    }
    return [
      InAppNotification(
        id: 1,
        title: 'Rent Due Reminder',
        body: 'Your August rent of ₹8,500 is due by 5th August.',
        type: 'payment',
        isRead: false,
        createdAt: '2026-08-02T10:00:00Z',
      ),
      InAppNotification(
        id: 2,
        title: 'Visitor Pass Approved',
        body: 'Visitor pass for Amit Verma has been generated.',
        type: 'visitor',
        isRead: true,
        createdAt: '2026-08-01T15:30:00Z',
      ),
    ];
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
