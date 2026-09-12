import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
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
  List<DayLogReport> _dayReports = [];
  bool _loading = true;
  final Set<String> _expandedDays = {};

  @override
  void initState() {
    super.initState();
    _fetchLogs();
  }

  Future<void> _fetchLogs() async {
    setState(() => _loading = _logs.isEmpty);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _apiService.setAuthToken(auth.token);
    final report = await _apiService.getAccessLogsReport();
    if (mounted) {
      final days = (report['day_summary'] as List<DayLogReport>?) ?? [];
      final logs = (report['logs'] as List<LogEntry>?) ?? [];

      setState(() {
        _logs = logs;
        _dayReports = days;
        _loading = false;
        // Expand the most recent 2 days by default
        _expandedDays.clear();
        for (var i = 0; i < days.length && i < 2; i++) {
          _expandedDays.add(days[i].date);
        }
      });
    }
  }

  String _formatDateHeader(String rawDate) {
    try {
      final d = DateTime.parse(rawDate);
      final now = DateTime.now();
      final diff = now.difference(d).inDays;
      final f = DateFormat('EEEE, dd MMM yyyy');
      if (diff == 0 && now.day == d.day) {
        return 'Today · ${DateFormat('dd MMM yyyy').format(d)}';
      } else if (diff == 1 || (diff == 0 && now.day != d.day)) {
        return 'Yesterday · ${DateFormat('dd MMM yyyy').format(d)}';
      }
      return f.format(d);
    } catch (_) {
      return rawDate;
    }
  }

  String _formatTime(String rawTime) {
    try {
      final dt = DateTime.parse(rawTime).toLocal();
      return DateFormat('hh:mm:ss a').format(dt);
    } catch (_) {
      return rawTime;
    }
  }

  String _formatShortTime(String rawTime) {
    try {
      final dt = DateTime.parse(rawTime).toLocal();
      return DateFormat('hh:mm a').format(dt);
    } catch (_) {
      return rawTime;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeProvider>(context);
    final colors = theme.resolvedColors(context);

    final totalPunches = _logs.length;
    final totalDays = _dayReports.length;
    final latestPunch = _logs.isNotEmpty ? _logs.first : null;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        title: const Text('Access Logs & Report'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Logs',
            onPressed: _fetchLogs,
          ),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: colors.accent))
          : RefreshIndicator(
              color: colors.accent,
              onRefresh: _fetchLogs,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Title & Subtitle
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Day-Wise Access Report',
                            style: TextStyle(
                              fontSize: 20 * theme.uiScale,
                              fontWeight: FontWeight.w800,
                              color: colors.text,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Detailed turnstile & biometric gate punches',
                            style: TextStyle(fontSize: 13 * theme.uiScale, color: colors.textSecondary),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: colors.accent.withAlpha(25),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: colors.accent.withAlpha(60)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.shield_outlined, size: 14, color: colors.accent),
                            const SizedBox(width: 4),
                            Text(
                              'Verified',
                              style: TextStyle(
                                fontSize: 11 * theme.uiScale,
                                fontWeight: FontWeight.bold,
                                color: colors.accent,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Metrics KPI Card
                  AppCard(
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: _KpiStat(
                                title: 'Total Punches',
                                value: '$totalPunches',
                                icon: Icons.fingerprint,
                                iconColor: colors.accent,
                                colors: colors,
                                theme: theme,
                              ),
                            ),
                            Container(width: 1, height: 40, color: colors.cardBorder),
                            Expanded(
                              child: _KpiStat(
                                title: 'Active Days',
                                value: '$totalDays',
                                icon: Icons.calendar_today_outlined,
                                iconColor: const Color(0xFF10B981),
                                colors: colors,
                                theme: theme,
                              ),
                            ),
                            Container(width: 1, height: 40, color: colors.cardBorder),
                            Expanded(
                              child: _KpiStat(
                                title: 'Avg/Day',
                                value: totalDays > 0 ? (totalPunches / totalDays).toStringAsFixed(1) : '0',
                                icon: Icons.speed,
                                iconColor: const Color(0xFFF59E0B),
                                colors: colors,
                                theme: theme,
                              ),
                            ),
                          ],
                        ),
                        if (latestPunch != null) ...[
                          const SizedBox(height: 12),
                          Divider(color: colors.cardBorder.withAlpha(50), height: 1),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Last Scan: ${_formatTime(latestPunch.time)} (${latestPunch.location ?? "Main Gate"})',
                                  style: TextStyle(
                                    fontSize: 12 * theme.uiScale,
                                    color: colors.textSecondary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Section Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'DAILY LOG BREAKDOWN',
                        style: TextStyle(
                          fontSize: 12 * theme.uiScale,
                          fontWeight: FontWeight.bold,
                          color: colors.textMuted,
                          letterSpacing: 1.0,
                        ),
                      ),
                      Text(
                        '$totalDays Days Recorded',
                        style: TextStyle(
                          fontSize: 12 * theme.uiScale,
                          fontWeight: FontWeight.w600,
                          color: colors.textMuted,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  if (_dayReports.isEmpty)
                    AppCard(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 32),
                          child: Column(
                            children: [
                              Icon(Icons.history_toggle_off, size: 40, color: colors.textMuted),
                              const SizedBox(height: 12),
                              Text(
                                'No attendance or gate records found.',
                                style: TextStyle(
                                  fontSize: 15 * theme.uiScale,
                                  fontWeight: FontWeight.w600,
                                  color: colors.text,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Punches from biometric turnstiles will appear here.',
                                style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textMuted),
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                  else
                    ..._dayReports.map((report) {
                      final isExpanded = _expandedDays.contains(report.date);

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: colors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isExpanded ? colors.accent.withAlpha(90) : colors.cardBorder,
                            width: isExpanded ? 1.2 : 1.0,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Day Summary Header (Clickable)
                            InkWell(
                              borderRadius: BorderRadius.circular(16),
                              onTap: () {
                                setState(() {
                                  if (isExpanded) {
                                    _expandedDays.remove(report.date);
                                  } else {
                                    _expandedDays.add(report.date);
                                  }
                                });
                              },
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: BoxDecoration(
                                                color: colors.accent.withAlpha(25),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Icon(
                                                Icons.calendar_month_outlined,
                                                size: 18,
                                                color: colors.accent,
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  _formatDateHeader(report.date),
                                                  style: TextStyle(
                                                    fontSize: 15 * theme.uiScale,
                                                    fontWeight: FontWeight.bold,
                                                    color: colors.text,
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  report.durationFormatted,
                                                  style: TextStyle(
                                                    fontSize: 12 * theme.uiScale,
                                                    color: colors.textSecondary,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: colors.accent.withAlpha(25),
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: Text(
                                                '${report.totalPunches} ${report.totalPunches == 1 ? "punch" : "punches"}',
                                                style: TextStyle(
                                                  fontSize: 12 * theme.uiScale,
                                                  fontWeight: FontWeight.bold,
                                                  color: colors.accent,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Icon(
                                              isExpanded ? Icons.expand_less : Icons.expand_more,
                                              size: 20,
                                              color: colors.textMuted,
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),

                                    // Quick First In & Last Out Pills
                                    const SizedBox(height: 12),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: colors.background.withAlpha(120),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            children: [
                                              const Icon(Icons.login, size: 14, color: Color(0xFF10B981)),
                                              const SizedBox(width: 6),
                                              Text(
                                                'First In: ',
                                                style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textMuted),
                                              ),
                                              Text(
                                                _formatShortTime(report.firstIn),
                                                style: TextStyle(
                                                  fontSize: 12 * theme.uiScale,
                                                  fontWeight: FontWeight.w600,
                                                  color: colors.text,
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (report.totalPunches > 1)
                                            Row(
                                              children: [
                                                const Icon(Icons.logout, size: 14, color: Color(0xFFF59E0B)),
                                                const SizedBox(width: 6),
                                                Text(
                                                  'Last Out: ',
                                                  style: TextStyle(fontSize: 12 * theme.uiScale, color: colors.textMuted),
                                                ),
                                                Text(
                                                  _formatShortTime(report.lastOut),
                                                  style: TextStyle(
                                                    fontSize: 12 * theme.uiScale,
                                                    fontWeight: FontWeight.w600,
                                                    color: colors.text,
                                                  ),
                                                ),
                                              ],
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Detailed Punch Stream (Shown when expanded)
                            if (isExpanded) ...[
                              Divider(color: colors.cardBorder.withAlpha(80), height: 1),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'PUNCH STREAM (${report.punches.length})',
                                      style: TextStyle(
                                        fontSize: 11 * theme.uiScale,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.8,
                                        color: colors.textMuted,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    ...report.punches.map((p) {
                                      final isEntry = p.type.toLowerCase().contains('entry') || p.type.toLowerCase().contains('in');
                                      final badgeColor = isEntry ? const Color(0xFF10B981) : const Color(0xFFF59E0B);
                                      final icon = isEntry ? Icons.arrow_downward : Icons.arrow_upward;

                                      return Container(
                                        margin: const EdgeInsets.only(bottom: 8),
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                        decoration: BoxDecoration(
                                          color: colors.background,
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(color: colors.cardBorder.withAlpha(60)),
                                        ),
                                        child: Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(6),
                                              decoration: BoxDecoration(
                                                color: badgeColor.withAlpha(25),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Icon(icon, size: 14, color: badgeColor),
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Row(
                                                    children: [
                                                      Text(
                                                        p.type.toUpperCase(),
                                                        style: TextStyle(
                                                          fontSize: 12 * theme.uiScale,
                                                          fontWeight: FontWeight.bold,
                                                          color: badgeColor,
                                                        ),
                                                      ),
                                                      if (p.verifyType != null && p.verifyType!.isNotEmpty) ...[
                                                        const SizedBox(width: 8),
                                                        Container(
                                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                                          decoration: BoxDecoration(
                                                            color: colors.accent.withAlpha(20),
                                                            borderRadius: BorderRadius.circular(4),
                                                          ),
                                                          child: Text(
                                                            p.verifyType!,
                                                            style: TextStyle(
                                                              fontSize: 10 * theme.uiScale,
                                                              fontWeight: FontWeight.w600,
                                                              color: colors.accent,
                                                            ),
                                                          ),
                                                        ),
                                                      ],
                                                    ],
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    p.location ?? 'Main Gate Turnstile',
                                                    style: TextStyle(
                                                      fontSize: 11 * theme.uiScale,
                                                      color: colors.textSecondary,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Text(
                                              _formatTime(p.time),
                                              style: TextStyle(
                                                fontSize: 12 * theme.uiScale,
                                                fontWeight: FontWeight.w600,
                                                color: colors.text,
                                              ),
                                            ),
                                          ],
                                        ),
                                      );
                                    }),
                                  ],
                                ),
                              ),
                            ],
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

class _KpiStat extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color iconColor;
  final dynamic colors;
  final ThemeProvider theme;

  const _KpiStat({
    required this.title,
    required this.value,
    required this.icon,
    required this.iconColor,
    required this.colors,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: iconColor),
        const SizedBox(height: 6),
        Text(
          value,
          style: TextStyle(
            fontSize: (18 * theme.uiScale).toDouble(),
            fontWeight: FontWeight.w800,
            color: colors.text,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          title,
          style: TextStyle(
            fontSize: (11 * theme.uiScale).toDouble(),
            color: colors.textMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

