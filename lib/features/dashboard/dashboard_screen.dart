import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/status_badge.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _dashboardData;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchDashboard();
  }

  Future<void> _fetchDashboard() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);
    final data = await _apiService.getDashboard();
    if (mounted) {
      setState(() {
        _dashboardData = data;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);
    final auth = Provider.of<AuthProvider>(context);
    final tenant = auth.tenant;

    final billing = _dashboardData?['billing'] as Map<String, dynamic>?;
    final notices = (_dashboardData?['notices'] as List?) ?? [];

    final rent = billing?['total_due'] ?? tenant?.rent ?? 8500.0;
    final dueDateStr = billing?['due_date']?.toString() ?? tenant?.dueDate ?? '5th of this month';
    final balance = (billing?['current_balance'] ?? rent) as num;
    final isPaid = balance <= 0;

    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Row(
          children: [
            Text(
              'Home',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20 * theme.uiScale),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            tooltip: 'Alerts',
            onPressed: () => context.go('/alerts'),
          ),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: colors.accent))
          : RefreshIndicator(
              color: colors.accent,
              onRefresh: _fetchDashboard,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Greeting & Room Card
                  AppCard(
                    backgroundColor: colors.accent.withAlpha(20),
                    border: BorderSide(color: colors.accent.withAlpha(50)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '👋 Welcome back,',
                              style: TextStyle(
                                fontSize: 13 * theme.uiScale,
                                color: colors.textSecondary,
                              ),
                            ),
                            StatusBadge(status: tenant?.status ?? 'Active'),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          tenant?.name ?? 'Tenant',
                          style: TextStyle(
                            fontSize: 22 * theme.uiScale,
                            fontWeight: FontWeight.w800,
                            color: colors.text,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _RoomPill(
                              icon: Icons.meeting_room,
                              label: 'Room ${tenant?.room ?? '104'}',
                            ),
                            const SizedBox(width: 8),
                            _RoomPill(
                              icon: Icons.single_bed,
                              label: 'Bed ${tenant?.bed ?? 'A'}',
                            ),
                            const SizedBox(width: 8),
                            _RoomPill(
                              icon: Icons.group,
                              label: tenant?.sharing ?? '2-Sharing',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Stay & Rent Status Card
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Rent & Billing',
                              style: TextStyle(
                                fontSize: 16 * theme.uiScale,
                                fontWeight: FontWeight.bold,
                                color: colors.text,
                              ),
                            ),
                            StatusBadge(status: isPaid ? 'Paid' : 'Due'),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isPaid ? 'Total Monthly Rent' : 'Amount Due',
                                  style: TextStyle(
                                    fontSize: 12 * theme.uiScale,
                                    color: colors.textMuted,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  currencyFmt.format(isPaid ? rent : balance),
                                  style: TextStyle(
                                    fontSize: 28 * theme.uiScale,
                                    fontWeight: FontWeight.w800,
                                    color: isPaid ? colors.success : colors.danger,
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              'Due: $dueDateStr',
                              style: TextStyle(
                                fontSize: 12 * theme.uiScale,
                                color: colors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        if (!isPaid) ...[
                          const SizedBox(height: 16),
                          AppButton(
                            text: 'Pay Now',
                            width: double.infinity,
                            icon: Icons.payment,
                            onPressed: () => context.go('/pay'),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Quick Actions Grid
                  Text(
                    'Quick Actions',
                    style: TextStyle(
                      fontSize: 18 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.4,
                    children: [
                      _QuickActionCard(
                        icon: Icons.currency_rupee,
                        title: 'Pay Rent',
                        subtitle: 'Billing & receipts',
                        color: const Color(0xFF10B981),
                        onTap: () => context.go('/pay'),
                      ),
                      _QuickActionCard(
                        icon: Icons.qr_code,
                        title: 'Visitor Pass',
                        subtitle: 'Invite guests',
                        color: const Color(0xFF3B82F6),
                        onTap: () => context.go('/guests'),
                      ),
                      _QuickActionCard(
                        icon: Icons.restaurant,
                        title: 'Mess Menu',
                        subtitle: 'Today\'s meals',
                        color: const Color(0xFFF59E0B),
                        onTap: () => context.go('/food'),
                      ),
                      _QuickActionCard(
                        icon: Icons.build_outlined,
                        title: 'Support',
                        subtitle: 'Raise tickets',
                        color: const Color(0xFF8B5CF6),
                        onTap: () => context.go('/support'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Notice Board
                  Text(
                    'Announcements & Notices',
                    style: TextStyle(
                      fontSize: 18 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (notices.isEmpty)
                    AppCard(
                      child: Center(
                        child: Text(
                          'No new announcements at this time.',
                          style: TextStyle(color: colors.textMuted),
                        ),
                      ),
                    )
                  else
                    ...notices.map((n) {
                      return AppCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Text('📢 ', style: TextStyle(fontSize: 16)),
                                Expanded(
                                  child: Text(
                                    n['title']?.toString() ?? 'Notice',
                                    style: TextStyle(
                                      fontSize: 15 * theme.uiScale,
                                      fontWeight: FontWeight.bold,
                                      color: colors.text,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              n['body']?.toString() ?? '',
                              style: TextStyle(
                                fontSize: 13 * theme.uiScale,
                                height: 1.4,
                                color: colors.textSecondary,
                              ),
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

class _RoomPill extends StatelessWidget {
  final IconData icon;
  final String label;

  const _RoomPill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors.card,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors.cardBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: colors.accent),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12 * theme.uiScale,
              fontWeight: FontWeight.w600,
              color: colors.text,
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: colors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: colors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(8),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withAlpha(25),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const Spacer(),
            Text(
              title,
              style: TextStyle(
                fontSize: 15 * theme.uiScale,
                fontWeight: FontWeight.bold,
                color: colors.text,
              ),
            ),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11 * theme.uiScale,
                color: colors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
