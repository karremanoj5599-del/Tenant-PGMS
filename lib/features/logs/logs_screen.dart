import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/log_entry.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/app_card.dart';

class LogsScreen extends StatefulWidget {
  const LogsScreen({super.key});

  @override
  State<LogsScreen> createState() => _LogsScreenState();
}

class _LogsScreenState extends State<LogsScreen> {
  final ApiService _apiService = ApiService();
  List<LogEntry> _logs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchLogs();
  }

  Future<void> _fetchLogs() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);
    final list = await _apiService.getAccessLogs();
    if (mounted) {
      setState(() {
        _logs = list;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(title: const Text('Access Logs')),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: colors.accent))
          : RefreshIndicator(
              color: colors.accent,
              onRefresh: _fetchLogs,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Text(
                    'Biometric & Gate Logs',
                    style: TextStyle(
                      fontSize: 18 * theme.uiScale,
                      fontWeight: FontWeight.bold,
                      color: colors.text,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Real-time records from biometric scanners and turnstiles.',
                    style: TextStyle(fontSize: 13 * theme.uiScale, color: colors.textSecondary),
                  ),
                  const SizedBox(height: 16),

                  if (_logs.isEmpty)
                    AppCard(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          child: Text('No access logs recorded.', style: TextStyle(color: colors.textMuted)),
                        ),
                      ),
                    )
                  else
                    ..._logs.map((log) {
                      final isEntry = log.type.toLowerCase().contains('entry');
                      final color = isEntry ? colors.success : colors.warning;
                      final icon = isEntry ? Icons.login : Icons.logout;

                      return AppCard(
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: color.withAlpha(25),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(icon, color: color, size: 20),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    log.type.toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 15 * theme.uiScale,
                                      fontWeight: FontWeight.bold,
                                      color: colors.text,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    log.location ?? 'Main Gate',
                                    style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textMuted),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              log.time,
                              style: TextStyle(
                                fontSize: 13 * theme.uiScale,
                                fontWeight: FontWeight.w600,
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
