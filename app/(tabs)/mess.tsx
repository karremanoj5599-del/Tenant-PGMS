import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMessMenu, toggleMealOptOut } from '@/services/api';

interface MenuItem {
  id: string;
  day: string;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  optedOut: boolean;
}

export default function MessScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMenu = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getMessMenu();
      setMenu(data.menu || []);
    } catch (err: any) {
      if (!silent) Alert.alert('Error', err?.message || 'Failed to load menu.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const handleToggleOptOut = async (id: string, currentOptOut: boolean) => {
    try {
      await toggleMealOptOut(id, !currentOptOut);
      // Wait for the server to process, then refetch
      fetchMenu(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update preference.');
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchMenu(true); };

  if (isLoading && menu.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={{ color: c.textSecondary, marginTop: 10 }}>Loading menu...</Text>
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
});
