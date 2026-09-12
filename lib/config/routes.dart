import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/login_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/payments/pay_screen.dart';
import '../features/mess/mess_screen.dart';
import '../features/mess/mess_scan_screen.dart';
import '../features/support/support_screen.dart';
import '../features/more/more_screen.dart';
import '../features/guests/guests_screen.dart';
import '../features/guests/visitor_invite_screen.dart';
import '../features/logs/logs_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/shell/tenant_shell_screen.dart';
import '../providers/auth_provider.dart';

GoRouter createRouter(AuthProvider authProvider) {
  final rootNavigatorKey = GlobalKey<NavigatorState>();
  final shellNavigatorKeyHome = GlobalKey<NavigatorState>();
  final shellNavigatorKeyPay = GlobalKey<NavigatorState>();
  final shellNavigatorKeyMess = GlobalKey<NavigatorState>();
  final shellNavigatorKeySupport = GlobalKey<NavigatorState>();
  final shellNavigatorKeyMore = GlobalKey<NavigatorState>();

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: authProvider,
    redirect: (context, state) {
      if (authProvider.isLoading) return null;

      final isLoggedIn = authProvider.isLoggedIn;
      final isLoggingIn = state.matchedLocation == '/login';

      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }

      if (isLoggedIn && isLoggingIn) {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/visitor',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const VisitorInviteScreen(),
      ),
      GoRoute(
        path: '/mess-scan',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const MessScanScreen(),
      ),
      // Sub-screens pushed with back navigation
      GoRoute(
        path: '/guests',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const GuestsScreen(),
      ),
      GoRoute(
        path: '/logs',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const LogsScreen(),
      ),
      GoRoute(
        path: '/alerts',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/profile',
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const ProfileScreen(),
      ),
      // Main 5-tab shell navigation
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return TenantShellScreen(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: shellNavigatorKeyHome,
            routes: [
              GoRoute(
                path: '/',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: shellNavigatorKeyPay,
            routes: [
              GoRoute(
                path: '/pay',
                builder: (context, state) => const PayScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: shellNavigatorKeyMess,
            routes: [
              GoRoute(
                path: '/food',
                builder: (context, state) => const MessScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: shellNavigatorKeySupport,
            routes: [
              GoRoute(
                path: '/support',
                builder: (context, state) => const SupportScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: shellNavigatorKeyMore,
            routes: [
              GoRoute(
                path: '/more',
                builder: (context, state) => const MoreScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
