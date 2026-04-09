import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboard } from '@/services/api';

interface DashboardData {
  tenant: {
    id?: number;
    name: string;
    room: string;
    bed: string;
    sharing: string;
    join_date: string;
    expiry_date: string;
    access_status: string;
  };
  billing: {
    current_balance: number;
    month: string;
    year: number;
    total_due: number;
    amount_paid: number;
  } | null;
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];
  const router = useRouter();
  const { tenant: authTenant, signOut } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const result = await getDashboard();
      setData(result);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load dashboard.';
      setError(msg);
      if (!silent) Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard(true);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  // Use real data or fall back to auth context info while loading
  const tenantName = data?.tenant?.name ?? authTenant?.name ?? '—';
  const balanceDue = data?.billing?.current_balance ?? 0;
  const rentMonth = data?.billing ? `${data.billing.month} ${data.billing.year}` : '—';
  const room = data?.tenant?.room ?? authTenant?.room ?? '—';
  const bed = data?.tenant?.bed ?? authTenant?.bed ?? '—';
  const sharing = data?.tenant?.sharing ?? authTenant?.sharing ?? '—';
  const accessStatus = data?.tenant?.access_status ?? 'active';

  if (isLoading && !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading your dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: c.text }]}>Connection Error</Text>
          <Text style={[styles.errorMsg, { color: c.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: c.accent }]}
            onPress={() => fetchDashboard()}
          >
            <Text style={styles.retryText}>Try Again</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.accent}
            colors={[c.accent]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: c.textSecondary }]}>{greeting()},</Text>
            <Text style={[styles.name, { color: c.accent }]}>{tenantName}</Text>
            <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>ID: #{data?.tenant?.id || authTenant?.id || '—'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: c.backgroundTertiary }]}
            onPress={handleSignOut}
          >
            <Text style={[styles.profileInitial, { color: c.text }]}>
              {tenantName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <View style={styles.balanceHeader}>
            <Text style={[styles.balanceLabel, { color: c.textSecondary }]}>Current Balance</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: balanceDue > 0 ? c.dangerLight : c.successLight }
            ]}>
              <Text style={[
                styles.statusText,
                { color: balanceDue > 0 ? c.danger : c.success }
              ]}>
                {balanceDue > 0 ? 'Overdue' : 'Paid'}
              </Text>
            </View>
          </View>

          <Text style={[styles.balanceAmount, { color: c.text }]}>
            ₹{balanceDue.toLocaleString('en-IN')}
          </Text>

          <Text style={[styles.balanceSubtext, { color: c.textMuted }]}>
            {balanceDue > 0 ? `Rent for ${rentMonth} is pending.` : 'All dues cleared. Great job! 🎉'}
          </Text>

          {balanceDue > 0 && (
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: c.accent }]}
              activeOpacity={0.85}
              onPress={() => router.push('/pay')}
            >
              <IconSymbol name="indianrupeesign.circle.fill" size={20} color="#FFFFFF" />
              <Text style={styles.payButtonText}>Pay Rent Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Room Info Card */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Your Room</Text>
          <View style={styles.statRow}>
            <View style={[styles.statBox, { backgroundColor: c.backgroundTertiary }]}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>Room</Text>
              <Text style={[styles.statValue, { color: c.text }]}>{room}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: c.backgroundTertiary }]}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>Bed</Text>
              <Text style={[styles.statValue, { color: c.text }]}>{bed}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: c.backgroundTertiary }]}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>Type</Text>
              <Text style={[styles.statValue, { color: c.text }]}>{sharing}</Text>
            </View>
          </View>
        </View>

        {/* Access Status */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Biometric Access</Text>
          <View style={styles.accessRow}>
            <View style={[
              styles.accessDot,
              { backgroundColor: accessStatus === 'active' ? c.success : c.danger }
            ]} />
            <Text style={[styles.accessText, { color: c.text }]}>
              {accessStatus === 'active' ? 'Access Active' : 'Access Locked'}
            </Text>
          </View>
          <Text style={[styles.accessSubtext, { color: c.textMuted }]}>
            {accessStatus === 'active'
              ? 'Your biometric access is working normally.'
              : 'Access locked. Please clear dues to restore access.'}
          </Text>
        </View>

        {/* Lease Period */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Lease Period</Text>
          <View style={styles.leaseRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>Joined</Text>
              <Text style={[styles.leaseDate, { color: c.text }]}>
                {formatDate(data?.tenant?.join_date ?? '')}
              </Text>
            </View>
            <View style={[styles.leaseDivider, { backgroundColor: c.separator }]} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>Expires</Text>
              <Text style={[styles.leaseDate, { color: c.text }]}>
                {formatDate(data?.tenant?.expiry_date ?? '')}
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: c.separator }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={[styles.signOutText, { color: c.danger }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, marginTop: 8 },
  errorTitle: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  errorMsg: { fontSize: 14, textAlign: 'center', marginHorizontal: 32 },
  retryButton: {
    marginTop: 16, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: Radius.md,
  },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  greeting: { fontSize: 14, fontWeight: '500' },
  name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 2 },
  profileButton: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  profileInitial: { fontSize: 18, fontWeight: '700' },
  balanceCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  balanceHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  balanceLabel: { fontSize: 15, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  statusText: { fontSize: 12, fontWeight: '700' },
  balanceAmount: { fontSize: 42, fontWeight: '800', letterSpacing: -2 },
  balanceSubtext: { fontSize: 14, marginTop: Spacing.sm },
  payButton: {
    marginTop: Spacing.xl, paddingVertical: 16, borderRadius: Radius.md,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  payButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  card: {
    borderRadius: Radius.lg, padding: Spacing.xxl,
    marginBottom: Spacing.lg, borderWidth: 1,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.lg },
  statRow: { flexDirection: 'row', gap: Spacing.md },
  statBox: { flex: 1, padding: Spacing.lg, borderRadius: Radius.md, alignItems: 'center' },
  statLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  accessRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  accessDot: { width: 10, height: 10, borderRadius: 5 },
  accessText: { fontSize: 16, fontWeight: '600' },
  accessSubtext: { fontSize: 13, lineHeight: 18 },
  leaseRow: { flexDirection: 'row', alignItems: 'center' },
  leaseDate: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  leaseDivider: { width: 1, height: 36, marginHorizontal: Spacing.lg },
  signOutButton: {
    marginTop: Spacing.md, paddingVertical: 14, borderRadius: Radius.md,
    borderWidth: 1, alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '600' },
});
