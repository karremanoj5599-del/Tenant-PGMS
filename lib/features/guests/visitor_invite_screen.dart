import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';

class VisitorInviteScreen extends StatefulWidget {
  const VisitorInviteScreen({super.key});

  @override
  State<VisitorInviteScreen> createState() => _VisitorInviteScreenState();
}

class _VisitorInviteScreenState extends State<VisitorInviteScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dateController = TextEditingController();
  final _purposeController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _dateController.text = DateFormat('yyyy-MM-dd').format(DateTime.now());
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _dateController.dispose();
    _purposeController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final date = _dateController.text.trim();
    final purpose = _purposeController.text.trim();

    if (name.isEmpty || phone.isEmpty || date.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill name, phone, and date.')),
      );
      return;
    }

    setState(() => _submitting = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);

    final result = await _apiService.inviteVisitor(
      name: name,
      phone: phone,
      date: date,
      purpose: purpose.isNotEmpty ? purpose : 'Personal Visit',
    );

    if (mounted) {
      setState(() => _submitting = false);
      if (result.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.data ?? 'Visitor pass generated!')),
        );
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.error ?? 'Failed to generate visitor pass.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: const Text('Invite Visitor')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Visitor Pass Details',
              style: TextStyle(
                fontSize: 20 * theme.uiScale,
                fontWeight: FontWeight.bold,
                color: colors.text,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'A unique gate QR code will be generated for your visitor.',
              style: TextStyle(
                fontSize: 14 * theme.uiScale,
                color: colors.textSecondary,
              ),
            ),
            const SizedBox(height: 24),

            AppTextField(
              label: 'Visitor Full Name',
              placeholder: 'e.g. Amit Verma',
              controller: _nameController,
            ),
            const SizedBox(height: 16),

            AppTextField(
              label: 'Phone Number',
              placeholder: '9876543210',
              prefixText: '+91 ',
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              maxLength: 10,
            ),
            const SizedBox(height: 16),

            AppTextField(
              label: 'Date of Visit (YYYY-MM-DD)',
              placeholder: '2026-08-06',
              controller: _dateController,
            ),
            const SizedBox(height: 16),

            AppTextField(
              label: 'Purpose of Visit',
              placeholder: 'e.g. Friend visiting for studies',
              controller: _purposeController,
              maxLines: 2,
            ),
            const SizedBox(height: 32),

            AppButton(
              text: 'Generate Gate Pass',
              isLoading: _submitting,
              icon: Icons.qr_code_2,
              onPressed: _handleSubmit,
            ),
          ],
        ),
      ),
    );
  }
}
