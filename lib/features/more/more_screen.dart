import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/theme_settings_modal.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  void _confirmLogout(BuildContext context) {
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

    final name = tenant?.name.trim() ?? 'Tenant';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'T';

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: Text(
          'More Features',
          style: TextStyle(
            fontSize: 20 * theme.uiScale,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        children: [
          // Profile Mini Card
          AppCard(
            onTap: () => context.push('/profile'),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: colors.accent,
                  child: Text(
                    initial,
                    style: TextStyle(
                      fontSize: 22 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: TextStyle(
                          fontSize: 17 * theme.uiScale,
                          fontWeight: FontWeight.bold,
                          color: colors.text,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        tenant?.mobile ?? '',
                        style: TextStyle(
                          fontSize: 13 * theme.uiScale,
                          color: colors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: colors.accent.withAlpha(25),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'Room ${tenant?.room ?? "—"} · Bed ${tenant?.bed ?? "—"}',
                          style: TextStyle(
                            fontSize: 11 * theme.uiScale,
                            fontWeight: FontWeight.w600,
                            color: colors.accent,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios, size: 16, color: colors.textMuted),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text(
            'ADDITIONAL SERVICES',
            style: TextStyle(
              fontSize: 12 * theme.uiScale,
              fontWeight: FontWeight.bold,
              color: colors.textMuted,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 10),

          // Feature 1: Guests & Visitors
          _FeatureTile(
            icon: Icons.people_alt_outlined,
            iconColor: const Color(0xFF3B82F6),
            title: 'Visitors & Guests',
            subtitle: 'Generate guest passes and view active visitors',
            onTap: () => context.push('/guests'),
            colors: colors,
            theme: theme,
          ),
          const SizedBox(height: 10),

          // Feature 2: Biometric Access Logs
          _FeatureTile(
            icon: Icons.fingerprint,
            iconColor: const Color(0xFF10B981),
            title: 'Biometric Access Logs',
            subtitle: 'View your gate punches, turnstile entries & exits',
            onTap: () => context.push('/logs'),
            colors: colors,
            theme: theme,
          ),
          const SizedBox(height: 10),

          // Feature 3: Notifications & Alerts
          _FeatureTile(
            icon: Icons.notifications_active_outlined,
            iconColor: const Color(0xFFF59E0B),
            title: 'Notifications & Alerts',
            subtitle: 'Rent reminders, mess updates and notices',
            onTap: () => context.push('/alerts'),
            colors: colors,
            theme: theme,
          ),
          const SizedBox(height: 24),

          Text(
            'PREFERENCES',
            style: TextStyle(
              fontSize: 12 * theme.uiScale,
              fontWeight: FontWeight.bold,
              color: colors.textMuted,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 10),

          // Theme Settings
          _FeatureTile(
            icon: Icons.palette_outlined,
            iconColor: colors.accent,
            title: 'Theme & Appearance',
            subtitle: 'Customize dark mode, colors & typography',
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const ThemeSettingsModal(),
              );
            },
            colors: colors,
            theme: theme,
          ),
          const SizedBox(height: 24),

          // Sign Out Button
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.withAlpha(25),
              foregroundColor: Colors.red,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.red.withAlpha(80)),
              ),
            ),
            icon: const Icon(Icons.logout, size: 18),
            label: Text(
              'Sign Out',
              style: TextStyle(
                fontSize: 15 * theme.uiScale,
                fontWeight: FontWeight.w600,
              ),
            ),
            onPressed: () => _confirmLogout(context),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final dynamic colors;
  final ThemeProvider theme;

  const _FeatureTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
    required this.colors,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: iconColor.withAlpha(25),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15 * theme.uiScale,
                    fontWeight: FontWeight.w600,
                    color: colors.text,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12 * theme.uiScale,
                    color: colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.arrow_forward_ios, size: 14, color: colors.textMuted),
        ],
      ),
    );
  }
}
