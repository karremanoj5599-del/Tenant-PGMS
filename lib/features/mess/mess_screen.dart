import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../models/menu_item.dart';
import '../../models/mess_history.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_card.dart';
import '../../widgets/status_badge.dart';

class MessScreen extends StatefulWidget {
  const MessScreen({super.key});

  @override
  State<MessScreen> createState() => _MessScreenState();
}

class _MessScreenState extends State<MessScreen> {
  final ApiService _apiService = ApiService();
  List<MenuItem> _menu = [];
  List<MessHistoryItem> _history = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);

    final m = await _apiService.getMessMenu();
    final h = await _apiService.getMessHistory();

    if (mounted) {
      setState(() {
        _menu = m;
        _history = h;
        _loading = false;
      });
    }
  }

  Future<void> _toggleOptOut(MenuItem item, bool value) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);

    // Optimistic update
    setState(() {
      final index = _menu.indexWhere((m) => m.id == item.id);
      if (index != -1) {
        _menu[index] = item.copyWith(optedOut: value);
      }
    });

    final success = await _apiService.toggleMealOptOut(item.id, value);
    if (!success && mounted) {
      // Revert on failure
      setState(() {
        final index = _menu.indexWhere((m) => m.id == item.id);
        if (index != -1) {
          _menu[index] = item.copyWith(optedOut: !value);
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update meal preference')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: const Text('Mess & Food'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            tooltip: 'Scan Mess QR',
            onPressed: () => context.push('/mess-scan'),
          ),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: colors.accent))
          : RefreshIndicator(
              color: colors.accent,
              onRefresh: _fetchData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Scan button banner
                  AppCard(
                    backgroundColor: colors.accent.withAlpha(20),
                    border: BorderSide(color: colors.accent.withAlpha(60)),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: colors.accent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 28),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Scan for Meal',
                                style: TextStyle(
                                  fontSize: 16 * theme.uiScale,
                                  fontWeight: FontWeight.bold,
                                  color: colors.text,
                                ),
                              ),
                              Text(
                                'Scan mess counter QR code to confirm attendance.',
                                style: TextStyle(
                                  fontSize: 12 * theme.uiScale,
                                  color: colors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: colors.accent,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () => context.push('/mess-scan'),
                          child: const Text('Scan'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Weekly Menu
                  Text(
                    'Weekly Food Menu',
                    style: TextStyle(
                      fontSize: 18 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 12),

                  ..._menu.map((m) {
                    return AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                m.day,
                                style: TextStyle(
                                  fontSize: 17 * theme.uiScale,
                                  fontWeight: FontWeight.bold,
                                  color: colors.accent,
                                ),
                              ),
                              Row(
                                children: [
                                  Text(
                                    m.optedOut ? 'Opted Out' : 'Opt In',
                                    style: TextStyle(
                                      fontSize: 12 * theme.uiScale,
                                      fontWeight: FontWeight.w600,
                                      color: m.optedOut ? colors.danger : colors.success,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Switch(
                                    value: !m.optedOut,
                                    activeThumbColor: colors.accent,
                                    onChanged: (val) => _toggleOptOut(m, !val),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          _MealLine(title: 'Breakfast', menu: m.breakfast, icon: Icons.free_breakfast),
                          _MealLine(title: 'Lunch', menu: m.lunch, icon: Icons.lunch_dining),
                          _MealLine(title: 'Dinner', menu: m.dinner, icon: Icons.dinner_dining),
                        ],
                      ),
                    );
                  }),

                  const SizedBox(height: 16),

                  // Scan History
                  Text(
                    'Meal History',
                    style: TextStyle(
                      fontSize: 18 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 12),

                  if (_history.isEmpty)
                    AppCard(
                      child: Center(
                        child: Text('No meal scan history yet.', style: TextStyle(color: colors.textMuted)),
                      ),
                    )
                  else
                    ..._history.map((h) {
                      return AppCard(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: colors.accent.withAlpha(20),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(Icons.check, color: colors.accent, size: 16),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      h.mealType,
                                      style: TextStyle(
                                        fontSize: 15 * theme.uiScale,
                                        fontWeight: FontWeight.bold,
                                        color: colors.text,
                                      ),
                                    ),
                                    Text(
                                      '${h.scanDate} at ${h.scanTime}',
                                      style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textMuted),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            StatusBadge(status: h.rentStatus ?? 'Paid'),
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

class _MealLine extends StatelessWidget {
  final String title;
  final String menu;
  final IconData icon;

  const _MealLine({required this.title, required this.menu, required this.icon});

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: colors.textMuted),
          const SizedBox(width: 8),
          Text(
            '$title: ',
            style: TextStyle(
              fontSize: 13 * theme.uiScale,
              fontWeight: FontWeight.bold,
              color: colors.text,
            ),
          ),
          Expanded(
            child: Text(
              menu,
              style: TextStyle(
                fontSize: 13 * theme.uiScale,
                color: colors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
