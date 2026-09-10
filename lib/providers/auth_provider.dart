import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/tenant.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  static const _storage = FlutterSecureStorage();
  final ApiService apiService = ApiService();

  bool _isLoading = true;
  String? _token;
  TenantInfo? _tenant;

  bool get isLoading => _isLoading;
  bool get isLoggedIn => _token != null && _token!.isNotEmpty;
  String? get token => _token;
  TenantInfo? get tenant => _tenant;

  AuthProvider() {
    _loadAuth();
  }

  Future<void> _loadAuth() async {
    try {
      final storedToken = await _storage.read(key: 'auth_token');
      final storedTenant = await _storage.read(key: 'auth_tenant');

      if (storedToken != null && storedTenant != null) {
        // Migration: If token looks like a JWT (> 50 chars), clear stale token
        if (storedToken.length > 50) {
          await _storage.delete(key: 'auth_token');
          await _storage.delete(key: 'auth_tenant');
          _token = null;
          _tenant = null;
          apiService.setAuthToken(null);
        } else {
          _token = storedToken;
          _tenant = TenantInfo.fromJson(jsonDecode(storedTenant));
          apiService.setAuthToken(storedToken, userId: _tenant?.userId?.toString());
        }
      }
    } catch (e) {
      debugPrint('Failed to restore auth session: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<String?> login(String mobile, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await apiService.login(mobile, password);
      if (result.success && result.data != null) {
        final t = result.data!['token'] as String;
        final tenantInfo = result.data!['tenant'] as TenantInfo;
        await signIn(t, tenantInfo);
        return null;
      } else {
        return result.error ?? 'Invalid credentials.';
      }
    } catch (e) {
      return 'Could not connect to server.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> demoLogin() async {
    final err = await login('9876543210', '1234');
    if (err != null) {
      final demoTenant = TenantInfo(
        id: 2226,
        name: 'Demo Tenant',
        mobile: '+919876543210',
        room: '104',
        bed: 'A',
        sharing: '2-Sharing',
        userId: 1,
        rent: 8500.0,
        dueDate: '2026-08-05',
        deposit: 17000.0,
        status: 'Active',
      );
      await signIn('2226', demoTenant);
    }
  }

  Future<void> signIn(String newToken, TenantInfo tenantInfo) async {
    _token = newToken;
    _tenant = tenantInfo;
    apiService.setAuthToken(newToken, userId: tenantInfo.userId?.toString());

    try {
      await _storage.write(key: 'auth_token', value: newToken);
      await _storage.write(key: 'auth_tenant', value: jsonEncode(tenantInfo.toJson()));
    } catch (e) {
      debugPrint('Failed to store auth: $e');
    }
    notifyListeners();
  }

  Future<void> signOut() async {
    _token = null;
    _tenant = null;
    apiService.setAuthToken(null);

    try {
      await _storage.delete(key: 'auth_token');
      await _storage.delete(key: 'auth_tenant');
    } catch (e) {
      debugPrint('Failed to clear auth: $e');
    }
    notifyListeners();
  }

  void updateTenant(TenantInfo updated) {
    _tenant = updated;
    _storage.write(key: 'auth_tenant', value: jsonEncode(updated.toJson()));
    notifyListeners();
  }
}
