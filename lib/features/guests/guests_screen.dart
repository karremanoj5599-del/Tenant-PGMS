import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../models/visitor.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/status_badge.dart';

class GuestsScreen extends StatefulWidget {
  const GuestsScreen({super.key});

  @override
  State<GuestsScreen> createState() => _GuestsScreenState();
}

class _GuestsScreenState extends State<GuestsScreen> {
  final ApiService _apiService = ApiService();
  List<Visitor> _visitors = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchVisitors();
  }

  Future<void> _fetchVisitors() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);
    final list = await _apiService.getVisitors();
    if (mounted) {
      setState(() {
        _visitors = list;
        _loading = false;
      });
    }
  }

  void _showPassModal(Visitor visitor) {
    showDialog(
      context: context,
      builder: (ctx) {
        final theme = Provider.of<ThemeProvider>(context);
        final colors = theme.resolvedColors(context);

        return Dialog(
          backgroundColor: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: colors.card,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: colors.cardBorder),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Visitor Gate Pass',
                  style: TextStyle(
                    fontSize: 20 * theme.uiScale,
                    fontWeight: FontWeight.bold,
                    color: colors.text,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  visitor.name,
                  style: TextStyle(fontSize: 15 * theme.uiScale, color: colors.accent, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 20),

                // QR Code Display
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: QrImageView(
                    data: visitor.passCode,
                    version: QrVersions.auto,
                    size: 200.0,
                  ),
                ),
                const SizedBox(height: 16),

                Text(
                  'PASS CODE',
                  style: TextStyle(
                    fontSize: 11 * theme.uiScale,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.bold,
                    color: colors.textMuted,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  visitor.passCode,
                  style: TextStyle(
                    fontSize: 26 * theme.uiScale,
                    letterSpacing: 4,
                    fontWeight: FontWeight.w800,
                    color: colors.text,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Show this QR code or 6-digit code at security gate.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textSecondary),
                ),
                const SizedBox(height: 20),

                AppButton(
                  text: 'Close',
                  width: double.infinity,
                  variant: AppButtonVariant.secondary,
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: const Text('Visitors & Guests')),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: colors.accent))
          : RefreshIndicator(
              color: colors.accent,
              onRefresh: _fetchVisitors,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Action button to invite guest
                  AppButton(
                    text: '+ Invite New Visitor',
                    icon: Icons.person_add,
                    width: double.infinity,
                    onPressed: () async {
                      await context.push('/visitor');
                      _fetchVisitors();
                    },
                  ),
                  const SizedBox(height: 20),

                  Text(
                    'Active & Recent Passes',
                    style: TextStyle(
                      fontSize: 18 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (_visitors.isEmpty)
                    AppCard(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          child: Text(
                            'No visitor passes found. Tap "+ Invite New Visitor" to generate one.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: colors.textMuted),
                          ),
                        ),
                      ),
                    )
                  else
                    ..._visitors.map((visitor) {
                      return AppCard(
                        onTap: () => _showPassModal(visitor),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  visitor.name,
                                  style: TextStyle(
                                    fontSize: 16 * theme.uiScale,
                                    fontWeight: FontWeight.bold,
                                    color: colors.text,
                                  ),
                                ),
                                StatusBadge(status: visitor.status),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Phone: ${visitor.phone}  ·  Date: ${visitor.visitDate}',
                              style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textSecondary),
                            ),
                            if (visitor.purpose != null && visitor.purpose!.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Purpose: ${visitor.purpose}',
                                style: TextStyle(fontSize: 13 * theme.uiScale, color: colors.textMuted),
                              ),
                            ],
                            const SizedBox(height: 12),
                            Divider(color: colors.separator),
                            const SizedBox(height: 8),

                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.qr_code, size: 18, color: colors.accent),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Pass Code: ${visitor.passCode}',
                                      style: TextStyle(
                                        fontSize: 14 * theme.uiScale,
                                        fontWeight: FontWeight.bold,
                                        color: colors.accent,
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  'Tap for QR',
                                  style: TextStyle(
                                    fontSize: 12 * theme.uiScale,
                                    fontWeight: FontWeight.w600,
                                    color: colors.accent,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
