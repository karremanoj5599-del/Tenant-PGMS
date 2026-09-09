import 'package:flutter/material.dart';
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

                        IconData icon;
                        Color iconColor;
                        switch (notif.type.toLowerCase()) {
                          case 'payment':
                            icon = Icons.payment;
                            iconColor = colors.success;
                            break;
                          case 'visitor':
                            icon = Icons.badge;
                            iconColor = colors.accent;
                            break;
                          default:
                            icon = Icons.notifications;
                            iconColor = colors.warning;
                        }

                        return AppCard(
                          onTap: () => _markAsRead(notif),
                          backgroundColor: notif.isRead ? colors.card : colors.accent.withAlpha(15),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: iconColor.withAlpha(25),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(icon, color: iconColor, size: 20),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            notif.title,
                                            style: TextStyle(
                                              fontSize: 15 * theme.uiScale,
                                              fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.bold,
                                              color: colors.text,
                                            ),
                                          ),
                                        ),
                                        if (!notif.isRead)
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
                                    const SizedBox(height: 4),
                                    Text(
                                      notif.body,
                                      style: TextStyle(
                                        fontSize: 13 * theme.uiScale,
                                        color: colors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      dateStr,
                                      style: TextStyle(fontSize: 11 * theme.uiScale, color: colors.textMuted),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
