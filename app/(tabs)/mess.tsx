import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMessMenu, toggleMealOptOut, getMessHistory } from '@/services/api';

interface MenuItem {
  id: string;
  day: string;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  optedOut: boolean;
}

interface HistoryItem {
  id: number;
  scan_date: string;
  scan_time: string;
  meal_type: string;
  rent_status: string;
}

export default function MessScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [menuData, historyData] = await Promise.all([
        getMessMenu().catch(() => ({ menu: [] })),
        getMessHistory().catch(() => ({ history: [] }))
      ]);
      setMenu(menuData.menu || []);
      setHistory(historyData.history || []);
    } catch (err: any) {
      if (!silent) Alert.alert('Error', err?.message || 'Failed to load mess data.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleOptOut = async (id: string, currentOptOut: boolean) => {
    try {
      await toggleMealOptOut(id, !currentOptOut);
      fetchData(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update preference.');
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  if (isLoading && menu.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={{ color: c.textSecondary, marginTop: 10 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.accent }]}>Food Menu</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Weekly mess schedule and meal preferences.</Text>
        </View>

        {menu.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder, opacity: item.optedOut ? 0.6 : 1 }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.dayText, { color: c.text }]}>{item.day}</Text>
              <TouchableOpacity
                style={[styles.optOutBtn, { backgroundColor: item.optedOut ? c.successLight : c.dangerLight }]}
                onPress={() => handleToggleOptOut(item.id, item.optedOut)}
              >
                <Text style={[styles.optOutText, { color: item.optedOut ? c.success : c.danger }]}>
                  {item.optedOut ? 'Opt In' : 'Opt Out'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.mealRow, { borderBottomColor: c.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.mealLabel, { color: c.textSecondary }]}>Breakfast</Text>
              <Text style={[styles.mealDesc, { color: c.text }]}>{item.breakfast}</Text>
            </View>
            <View style={[styles.mealRow, { borderBottomColor: c.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.mealLabel, { color: c.textSecondary }]}>Lunch</Text>
              <Text style={[styles.mealDesc, { color: c.text }]}>{item.lunch}</Text>
            </View>
            <View style={styles.mealRow}>
              <Text style={[styles.mealLabel, { color: c.textSecondary }]}>Dinner</Text>
              <Text style={[styles.mealDesc, { color: c.text }]}>{item.dinner}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.header, { marginTop: Spacing.xl }]}>
          <Text style={[styles.title, { color: c.accent, fontSize: 20 }]}>Scan History</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Your recent meal check-ins.</Text>
        </View>

        {history.length === 0 ? (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder, alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ color: c.textSecondary }}>No recent meals found.</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            {history.map((h, idx) => (
              <View key={h.id}>
                <View style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyMeal, { color: c.text }]}>
                      {h.meal_type.charAt(0).toUpperCase() + h.meal_type.slice(1)}
                    </Text>
                    <Text style={[styles.historyTime, { color: c.textSecondary }]}>
                      {formatDate(h.scan_date)} • {formatTime(h.scan_time)}
                    </Text>
                  </View>
                  <View style={[styles.historyStatus, { backgroundColor: h.rent_status === 'paid' ? c.successLight : c.warningLight }]}>
                    <Text style={[styles.historyStatusText, { color: h.rent_status === 'paid' ? c.success : c.warning }]}>
                      {h.rent_status === 'paid' ? 'Paid' : 'Pending Rent'}
                    </Text>
                  </View>
                </View>
                {idx < history.length - 1 && <View style={[styles.divider, { backgroundColor: c.separator }]} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: Spacing.xxl },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.md, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  dayText: { fontSize: 18, fontWeight: '700' },
  optOutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  optOutText: { fontSize: 12, fontWeight: '700' },
  mealRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  mealLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  mealDesc: { fontSize: 14, flex: 2, textAlign: 'right' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  historyMeal: { fontSize: 16, fontWeight: '600' },
  historyTime: { fontSize: 12, marginTop: 4 },
  historyStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  historyStatusText: { fontSize: 12, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.sm },
});
