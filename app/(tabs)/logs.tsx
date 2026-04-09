import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getAccessLogs } from '@/services/api';

interface LogEntry {
  id: number;
  punch_type: 'in' | 'out';
  punch_time: string;
  device_name: string;
}

interface GroupedLogs {
  dateLabel: string;
  logs: LogEntry[];
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return '—'; }
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();

    const formatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    if (isSameDay(d, today)) return `Today, ${formatted}`;
    if (isSameDay(d, yesterday)) return `Yesterday, ${formatted}`;
    return formatted;
  } catch { return dateStr; }
}

function groupLogsByDate(logs: LogEntry[]): GroupedLogs[] {
  const map: Record<string, LogEntry[]> = {};
  const order: string[] = [];

  for (const log of logs) {
    try {
      const d = new Date(log.punch_time);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) {
        map[key] = [];
        order.push(key);
      }
      map[key].push(log);
    } catch {
      const key = log.punch_time;
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(log);
    }
  }

  return order.map((key) => ({
    dateLabel: formatDateLabel(map[key][0].punch_time),
    logs: map[key],
  }));
}

export default function LogsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const result = await getAccessLogs(100, 0);
      setLogs(result.logs ?? []);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load access logs.';
      setError(msg);
      if (!silent) Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const onRefresh = () => { setRefreshing(true); fetchLogs(true); };

  const checkIns = logs.filter((l) => l.punch_type === 'in').length;
  const checkOuts = logs.filter((l) => l.punch_type === 'out').length;
  const grouped = groupLogsByDate(logs);

  if (isLoading && logs.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading access logs…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && logs.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: c.text }]}>Could Not Load</Text>
          <Text style={[styles.errorMsg, { color: c.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: c.accent }]} onPress={() => fetchLogs()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.accent }]}>Access Logs</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Your biometric punch-in / punch-out history.
          </Text>
        </View>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: c.success }]}>{checkIns}</Text>
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Check-ins</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: c.separator }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: c.warning }]}>{checkOuts}</Text>
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Check-outs</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: c.separator }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryCount, { color: c.accent }]}>{grouped.length}</Text>
            <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Days</Text>
          </View>
        </View>

        {/* No logs */}
        {logs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>No access log records found.</Text>
          </View>
        ) : null}

        {/* Grouped Logs */}
        {grouped.map(({ dateLabel, logs: dayLogs }) => (
          <View key={dateLabel} style={styles.dateGroup}>
            <Text style={[styles.dateHeader, { color: c.textMuted }]}>{dateLabel}</Text>
            {dayLogs.map((log, index) => (
              <View
                key={log.id}
                style={[
                  styles.logItem,
                  {
                    backgroundColor: c.card,
                    borderColor: c.cardBorder,
                    borderBottomLeftRadius: index === dayLogs.length - 1 ? Radius.lg : 0,
                    borderBottomRightRadius: index === dayLogs.length - 1 ? Radius.lg : 0,
                    borderTopLeftRadius: index === 0 ? Radius.lg : 0,
                    borderTopRightRadius: index === 0 ? Radius.lg : 0,
                  },
                ]}
              >
                <View style={[
                  styles.logIconBg,
                  { backgroundColor: log.punch_type === 'in' ? c.successLight : c.warningLight },
                ]}>
                  <IconSymbol
                    name={log.punch_type === 'in' ? 'arrow.down.left' : 'arrow.up.right'}
                    size={18}
                    color={log.punch_type === 'in' ? c.success : c.warning}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logType, { color: c.text }]}>
                    {log.punch_type === 'in' ? 'Checked In' : 'Checked Out'}
                  </Text>
                  <Text style={[styles.logDevice, { color: c.textMuted }]}>{log.device_name}</Text>
                </View>
                <Text style={[styles.logTime, { color: c.text }]}>{formatTime(log.punch_time)}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15 },
  errorTitle: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  errorMsg: { fontSize: 14, textAlign: 'center', marginHorizontal: 32 },
  retryBtn: { marginTop: 16, paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.md },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  header: { marginBottom: Spacing.xxl },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  summaryCard: {
    flexDirection: 'row', borderRadius: Radius.lg,
    padding: Spacing.xl, marginBottom: Spacing.xxl, borderWidth: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  summaryDivider: { width: 1, height: '80%', alignSelf: 'center' },
  emptyCard: { borderRadius: Radius.lg, padding: Spacing.xxl, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  dateGroup: { marginBottom: Spacing.xl },
  dateHeader: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm, marginLeft: 4 },
  logItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, borderWidth: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  logIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  logType: { fontSize: 15, fontWeight: '600' },
  logDevice: { fontSize: 12, marginTop: 2 },
  logTime: { fontSize: 15, fontWeight: '700' },
});
