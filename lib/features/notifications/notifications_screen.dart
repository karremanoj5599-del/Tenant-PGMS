import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/notification.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_card.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final ApiService _apiService = ApiService();
  List<InAppNotification> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);
    final list = await _apiService.getNotifications();
    if (mounted) {
      setState(() {
        _notifications = list;
        _loading = false;
      });
    }
  }

  Future<void> _markAsRead(InAppNotification n) async {
    if (n.isRead) return;

    setState(() {
      final idx = _notifications.indexWhere((item) => item.id == n.id);
      if (idx != -1) {
        _notifications[idx] = n.copyWith(isRead: true);
      }
    });

    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);
    await _apiService.markNotificationRead(n.id);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: const Text('Notifications & Alerts')),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: colors.accent))
          : RefreshIndicator(
              color: colors.accent,
              onRefresh: _fetchNotifications,
              child: _notifications.isEmpty
                  ? Center(
                      child: Text(
                        'No notifications at this time.',
                        style: TextStyle(color: colors.textMuted, fontSize: 16 * theme.uiScale),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _notifications.length,
                      itemBuilder: (context, index) {
                        final notif = _notifications[index];
                        String dateStr = notif.createdAt;
                        try {
                          final dt = DateTime.parse(notif.createdAt);
                          dateStr = DateFormat('dd MMM, hh:mm a').format(dt);
                        } catch (_) {}

                        final titleLower = notif.title.toLowerCase();
                        final bodyLower = notif.body.toLowerCase();
                        final isOverdue = titleLower.contains('overdue') || bodyLower.contains('overdue');
                        final isRentPayment = titleLower.contains('rent') ||
                            bodyLower.contains('rent') ||
                            notif.type.toLowerCase() == 'payment';

                        IconData icon;
                        Color iconColor;
                        String? badgeLabel;
                        Color badgeBg = Colors.transparent;
                        Color badgeText = colors.text;

                        if (isOverdue) {
                          icon = Icons.warning_amber_rounded;
                          iconColor = colors.danger;
                          badgeLabel = 'URGENT OVERDUE';
                          badgeBg = colors.danger.withAlpha(30);
                          badgeText = colors.danger;
                        } else if (isRentPayment) {
                          if (titleLower.contains('success') ||
                              bodyLower.contains('recorded') ||
                              titleLower.contains('receipt')) {
                            icon = Icons.check_circle_outline;
                            iconColor = colors.success;
                            badgeLabel = 'CONFIRMED';
                            badgeBg = colors.success.withAlpha(30);
                            badgeText = colors.success;
                          } else {
                            icon = Icons.schedule_rounded;
                            iconColor = colors.warning;
                            badgeLabel = 'RENT DUE';
                            badgeBg = colors.warning.withAlpha(35);
                            badgeText = colors.warning;
                          }
                        } else if (notif.type.toLowerCase() == 'visitor') {
                          icon = Icons.badge_outlined;
                          iconColor = colors.accent;
                          badgeLabel = 'VISITOR';
                          badgeBg = colors.accent.withAlpha(25);
                          badgeText = colors.accent;
                        } else {
                          icon = Icons.notifications_none_rounded;
                          iconColor = colors.accent;
                        }

                        return AppCard(
                          onTap: () => _markAsRead(notif),
                          backgroundColor: notif.isRead
                              ? colors.card
                              : (isOverdue
                                  ? colors.danger.withAlpha(15)
                                  : colors.accent.withAlpha(15)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: iconColor.withAlpha(25),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(icon, color: iconColor, size: 22),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                notif.title,
                                                style: TextStyle(
                                                  fontSize: 15 * theme.uiScale,
                                                  fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.bold,
                                                  color: isOverdue ? colors.danger : colors.text,
                                                ),
                                              ),
                                            ),
                                            if (badgeLabel != null)
                                              Container(
                                                margin: const EdgeInsets.only(left: 6),
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: badgeBg,
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  badgeLabel,
                                                  style: TextStyle(
                                                    fontSize: 10 * theme.uiScale,
                                                    fontWeight: FontWeight.bold,
                                                    color: badgeText,
                                                    letterSpacing: 0.5,
                                                  ),
                                                ),
                                              )
                                            else if (!notif.isRead)
                                              Container(
                                                width: 8,
                                                height: 8,
                                                decoration: BoxDecoration(
                                                  color: colors.accent,
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          notif.body,
                                          style: TextStyle(
                                            fontSize: 13 * theme.uiScale,
                                            color: colors.textSecondary,
                                            height: 1.4,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          dateStr,
                                          style: TextStyle(fontSize: 11 * theme.uiScale, color: colors.textMuted),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),

                              // Quick Action button for Rent / Overdue reminders
                              if (isRentPayment && !notif.title.toLowerCase().contains('success')) ...[
                                const SizedBox(height: 12),
                                Divider(color: colors.separator, height: 1),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    ElevatedButton.icon(
                                      onPressed: () {
                                        _markAsRead(notif);
                                        context.go('/pay');
                                      },
                                      icon: const Icon(Icons.account_balance_wallet_outlined, size: 16),
                                      label: Text(
                                        isOverdue ? 'Pay Overdue Rent Now' : 'Pay Rent Now',
                                        style: const TextStyle(fontWeight: FontWeight.bold),
                                      ),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: isOverdue ? colors.danger : colors.accent,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        elevation: 0,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
