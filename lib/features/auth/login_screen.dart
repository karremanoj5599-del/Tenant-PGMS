import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/api_config.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/connection_problem_view.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _mobileController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _mobileError;
  String? _passwordError;
  String? _formError;

  // Server Connectivity State
  bool? _isServerConnected;
  bool _isCheckingConnection = false;
  String? _connectionErrorDetail;

  @override
  void initState() {
    super.initState();
    _checkServerConnection();
  }

  @override
  void dispose() {
    _mobileController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _checkServerConnection() async {
    if (!mounted) return;
    setState(() {
      _isCheckingConnection = true;
      _connectionErrorDetail = null;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final result = await auth.apiService.checkConnection();

    if (mounted) {
      setState(() {
        _isCheckingConnection = false;
        _isServerConnected = result.success;
        if (!result.success) {
          _connectionErrorDetail = result.error;
        }
      });
    }
  }

  void _showConnectionProblem({String? customError}) {
    ConnectionProblemView.showModal(
      context,
      serverUrl: ApiConfig.baseUrl,
      errorDetail: customError ?? _connectionErrorDetail,
      onRetry: () async {
        await _checkServerConnection();
        if (_isServerConnected == false) {
          throw Exception('Still offline');
        }
      },
    );
  }

  bool _validate() {
    setState(() {
      _mobileError = null;
      _passwordError = null;
      _formError = null;
    });

    final mobile = _mobileController.text.trim();
    final password = _passwordController.text.trim();
    bool valid = true;

    if (mobile.isEmpty || mobile.length < 10) {
      setState(() => _mobileError = 'Enter a valid 10-digit mobile number.');
      valid = false;
    }

    if (password.isEmpty || password.length < 4) {
      setState(() => _passwordError = 'Enter your 4-digit PIN or password.');
      valid = false;
    }

    return valid;
  }

  Future<void> _handleLogin({String? overrideMobile, String? overridePassword}) async {
    final mobile = overrideMobile ?? _mobileController.text.trim();
    final password = overridePassword ?? _passwordController.text.trim();

    if (overrideMobile == null && !_validate()) return;

    setState(() {
      _isLoading = true;
      _formError = null;
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final error = await auth.login(mobile, password);

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (error != null) {
          _formError = error;
        }
      });

      if (error != null) {
        final isConnectionIssue = error.contains('CONNECTION_ERROR') ||
            error.contains('Could not connect') ||
            error.contains('SocketException') ||
            error.contains('ClientException') ||
            error.contains('Failed host lookup');

        if (isConnectionIssue) {
          setState(() => _isServerConnected = false);
          _showConnectionProblem(customError: error.replaceFirst('CONNECTION_ERROR: ', ''));
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      error,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
              backgroundColor: Colors.red.shade700,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 4),
            ),
          );
        }
      }
    }
  }

  Widget _buildServerStatusBadge(dynamic colors, ThemeProvider theme) {
    if (_isCheckingConnection) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.amber.withAlpha(25),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.amber.withAlpha(80)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.amber),
            ),
            const SizedBox(width: 8),
            Text(
              'Checking server connection...',
              style: TextStyle(
                fontSize: 12 * theme.uiScale,
                color: Colors.amber,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    if (_isServerConnected == false) {
      return InkWell(
        onTap: () => _showConnectionProblem(),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.red.withAlpha(30),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.red.withAlpha(120)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFFEF4444),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Server Offline · Tap for info',
                style: TextStyle(
                  fontSize: 12 * theme.uiScale,
                  color: const Color(0xFFEF4444),
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.arrow_forward_ios, size: 10, color: Color(0xFFEF4444)),
            ],
          ),
        ),
      );
    }

    return InkWell(
      onTap: () => _showConnectionProblem(customError: 'Server is currently reachable and responding.'),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.green.withAlpha(25),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.green.withAlpha(80)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: Colors.green,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Server Online',
              style: TextStyle(
                fontSize: 12 * theme.uiScale,
                color: Colors.green,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Logo / Branding
                  Center(
                    child: Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        color: colors.accent.withAlpha(35),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Text('🏠', style: TextStyle(fontSize: 36)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Tenant PGMS',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 30 * theme.uiScale,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Your PG, at your fingertips.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 15 * theme.uiScale,
                      color: colors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Interactive Server Status Indicator
                  Center(
                    child: _buildServerStatusBadge(colors, theme),
                  ),
                  const SizedBox(height: 24),

                  // Login Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: colors.card,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: colors.cardBorder),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(12),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'Sign In',
                          style: TextStyle(
                            fontSize: 22 * theme.uiScale,
                            fontWeight: FontWeight.bold,
                            color: colors.text,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Use your registered mobile number and PIN.',
                          style: TextStyle(
                            fontSize: 14 * theme.uiScale,
                            color: colors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 20),

                        if (_formError != null && !_formError!.contains('CONNECTION_ERROR')) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: colors.danger.withAlpha(25),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: colors.danger),
                            ),
                            child: Text(
                              _formError!,
                              style: TextStyle(color: colors.danger, fontSize: 13),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        AppTextField(
                          label: 'Mobile Number',
                          placeholder: '9876543210',
                          prefixText: '+91 ',
                          controller: _mobileController,
                          keyboardType: TextInputType.phone,
                          maxLength: 10,
                          errorText: _mobileError,
                          onChanged: (_) {
                            if (_mobileError != null) setState(() => _mobileError = null);
                          },
                        ),
                        const SizedBox(height: 16),

                        AppTextField(
                          label: 'Password / PIN',
                          placeholder: '••••',
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          errorText: _passwordError,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_off : Icons.visibility,
                              color: colors.textMuted,
                              size: 20,
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                          onChanged: (_) {
                            if (_passwordError != null) setState(() => _passwordError = null);
                          },
                        ),
                        const SizedBox(height: 24),

                        AppButton(
                          text: 'Sign In',
                          isLoading: _isLoading,
                          onPressed: () => _handleLogin(),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  Text(
                    '© 2026 Tenant PGMS · Secure & Encrypted',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12 * theme.uiScale,
                      color: colors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
