import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/theme_settings_modal.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  void _showVacateNoticeModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _VacateNoticeModal(),
    );
  }

  void _showUpdatePinModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _UpdatePinModal(),
    );
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to log out of Tenant PGMS?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            onPressed: () {
              Navigator.of(ctx).pop();
              Provider.of<AuthProvider>(context, listen: false).signOut();
            },
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);
    final auth = Provider.of<AuthProvider>(context);
    final tenant = auth.tenant;

    final initial = (tenant?.name.isNotEmpty == true) ? tenant!.name[0].toUpperCase() : 'T';

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: const Text('Profile & Settings')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Column(
          children: [
            // Profile Card Header
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: colors.accent,
                    child: Text(
                      initial,
                      style: TextStyle(
                        fontSize: 32 * theme.uiScale,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    tenant?.name ?? 'Tenant User',
                    style: TextStyle(
                      fontSize: 22 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    tenant?.mobile ?? '+919876543210',
                    style: TextStyle(fontSize: 14 * theme.uiScale, color: colors.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Stay Details Card
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Stay Information',
                    style: TextStyle(
                      fontSize: 16 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 14),
                  _DetailRow(label: 'Room Number', value: tenant?.room ?? '104'),
                  _DetailRow(label: 'Bed Allocation', value: 'Bed ${tenant?.bed ?? 'A'}'),
                  _DetailRow(label: 'Occupancy Type', value: tenant?.sharing ?? '2-Sharing'),
                  if (tenant?.advanceVacateDate != null)
                    _DetailRow(label: 'Notice Vacate Date', value: tenant!.advanceVacateDate!),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Actions: Vacate Notice
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Stay Management',
                    style: TextStyle(
                      fontSize: 16 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Submit 30-day advance notice before leaving the PG.',
                    style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textSecondary),
                  ),
                  const SizedBox(height: 14),
                  AppButton(
                    text: 'Submit Vacate Notice',
                    variant: AppButtonVariant.outline,
                    width: double.infinity,
                    icon: Icons.calendar_today,
                    onPressed: _showVacateNoticeModal,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Theme & Display
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'App Preferences',
                    style: TextStyle(
                      fontSize: 16 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 14),
                  AppButton(
                    text: 'Theme & Typography Settings',
                    variant: AppButtonVariant.outline,
                    width: double.infinity,
                    icon: Icons.palette_outlined,
                    onPressed: () => ThemeSettingsModal.show(context),
                  ),
                  const SizedBox(height: 12),
                  AppButton(
                    text: 'Update Security PIN',
                    variant: AppButtonVariant.outline,
                    width: double.infinity,
                    icon: Icons.lock_outline,
                    onPressed: _showUpdatePinModal,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Sign out button
            AppButton(
              text: 'Sign Out',
              variant: AppButtonVariant.danger,
              width: double.infinity,
              icon: Icons.logout,
              onPressed: _confirmLogout,
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: colors.textMuted, fontSize: 13 * theme.uiScale)),
          Text(value, style: TextStyle(color: colors.text, fontWeight: FontWeight.bold, fontSize: 13 * theme.uiScale)),
        ],
      ),
    );
  }
}

class _VacateNoticeModal extends StatefulWidget {
  const _VacateNoticeModal();

  @override
  State<_VacateNoticeModal> createState() => _VacateNoticeModalState();
}

class _VacateNoticeModalState extends State<_VacateNoticeModal> {
  final _dateController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    // Default 30 days from now
    final vacate = DateTime.now().add(const Duration(days: 30));
    _dateController.text = DateFormat('yyyy-MM-dd').format(vacate);
  }

  @override
  void dispose() {
    _dateController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final date = _dateController.text.trim();
    if (date.isEmpty) return;

    setState(() => _submitting = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);

    final res = await _apiService.submitVacateNotice(date);

    if (mounted) {
      setState(() => _submitting = false);
      if (res.success) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res.data ?? 'Vacate notice submitted!')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res.error ?? 'Failed to submit notice.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Container(
      padding: EdgeInsets.only(
        top: 24,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: BoxDecoration(
        color: colors.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Submit Vacate Notice',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 20 * theme.uiScale,
              fontWeight: FontWeight.bold,
              color: colors.text,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Please select the planned move-out date. Security deposit settlement requires minimum 30 days advance notice.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13 * theme.uiScale, color: colors.textSecondary),
          ),
          const SizedBox(height: 20),

          AppTextField(
            label: 'Planned Vacate Date (YYYY-MM-DD)',
            controller: _dateController,
          ),
          const SizedBox(height: 24),

          AppButton(
            text: 'Confirm & Submit Notice',
            variant: AppButtonVariant.danger,
            isLoading: _submitting,
            onPressed: _handleSubmit,
          ),
        ],
      ),
    );
  }
}

class _UpdatePinModal extends StatefulWidget {
  const _UpdatePinModal();

  @override
  State<_UpdatePinModal> createState() => _UpdatePinModalState();
}

class _UpdatePinModalState extends State<_UpdatePinModal> {
  final _oldPinController = TextEditingController();
  final _newPinController = TextEditingController();
  final ApiService _apiService = ApiService();
  bool _pinUpdating = false;

  @override
  void dispose() {
    _oldPinController.dispose();
    _newPinController.dispose();
    super.dispose();
  }

  Future<void> _handleUpdatePin() async {
    final oldPin = _oldPinController.text.trim();
    final newPin = _newPinController.text.trim();

    if (oldPin.isEmpty || newPin.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter both current and new PIN')),
      );
      return;
    }

    setState(() => _pinUpdating = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);

    final result = await _apiService.updatePin(oldPin, newPin);

    if (mounted) {
      setState(() => _pinUpdating = false);
      if (result.success) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.data ?? 'Security PIN updated successfully')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.error ?? 'Failed to update PIN')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Container(
      padding: EdgeInsets.only(
        top: 24,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: BoxDecoration(
        color: colors.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Update Security PIN',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20 * theme.uiScale,
                fontWeight: FontWeight.bold,
                color: colors.text,
              ),
            ),
            const SizedBox(height: 20),

            AppTextField(
              label: 'Current PIN',
              placeholder: 'Enter current PIN',
              controller: _oldPinController,
              obscureText: true,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 14),

            AppTextField(
              label: 'New PIN',
              placeholder: 'Enter new PIN',
              controller: _newPinController,
              obscureText: true,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 24),

            Row(
              children: [
                Expanded(
                  child: AppButton(
                    text: 'Cancel',
                    variant: AppButtonVariant.secondary,
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: AppButton(
                    text: 'Update PIN',
                    isLoading: _pinUpdating,
                    onPressed: _handleUpdatePin,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
