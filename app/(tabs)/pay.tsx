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
import { getBilling, getPaymentHistory, recordPayment } from '@/services/api';

interface Billing {
  month: string;
  year: number;
  fixed_rent: number;
  previous_balance: number;
  total_due: number;
  amount_paid: number;
  current_balance: number;
  due_date: string;
}

interface Payment {
  id: number;
  amount: number;
  month: string;
  year: number;
  payment_method: string;
  transaction_id: string;
  created_at: string;
}

export default function PayScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];
  const router = useRouter();

  const [billing, setBilling] = useState<Billing | null>(null);
  const [history, setHistory] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const [billingRes, historyRes] = await Promise.all([
        getBilling(),
        getPaymentHistory(),
      ]);
      // The backend returns { success: true, billing: {...} } for billing
      if (billingRes.success && billingRes.billing) {
        setBilling(billingRes.billing);
      }
      // The backend returns { success: true, payments: [...] } for history
      setHistory(historyRes.payments ?? []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load billing.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  const handlePayNow = () => {
    if (!billing || billing.current_balance <= 0) return;

    Alert.alert(
      'Confirm Payment',
      `Pay ₹${billing.current_balance.toLocaleString('en-IN')} for ${billing.month} ${billing.year}?\n\nThis will be recorded as a cash payment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Payment',
          onPress: async () => {
            setIsPaying(true);
            try {
              await recordPayment({
                amount: billing.current_balance,
                month: billing.month,
                year: billing.year,
                payment_method: 'UPI',
              });
              Alert.alert('✅ Payment Recorded', `₹${billing.current_balance.toLocaleString('en-IN')} has been recorded for ${billing.month} ${billing.year}.`);
              fetchData(true);
            } catch (err: any) {
              Alert.alert('Payment Failed', err?.message || 'Could not record payment. Please try again.');
            } finally {
              setIsPaying(false);
            }
          },
        },
      ]
    );
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

  if (isLoading && !billing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading billing…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !billing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={[styles.errorTitle, { color: c.text }]}>Could Not Load</Text>
          <Text style={[styles.errorMsg, { color: c.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: c.accent }]} onPress={() => fetchData()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const dueDateLabel = billing?.due_date ? `Due by ${formatDate(billing.due_date)}` : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.accent }]}>Make Payment</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Clear your pending dues securely.
          </Text>
        </View>

        {/* Billing Breakdown */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>
            Billing — {billing?.month} {billing?.year}
          </Text>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: c.textSecondary }]}>Fixed Rent</Text>
            <Text style={[styles.billValue, { color: c.text }]}>
              ₹{(billing?.fixed_rent ?? 0).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: c.separator }]} />

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: c.textSecondary }]}>Previous Balance</Text>
            <Text style={[styles.billValue, { color: (billing?.previous_balance ?? 0) > 0 ? c.danger : c.text }]}>
              ₹{(billing?.previous_balance ?? 0).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: c.separator }]} />

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: c.textSecondary }]}>Amount Paid</Text>
            <Text style={[styles.billValue, { color: c.success }]}>
              − ₹{(billing?.amount_paid ?? 0).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: c.separator }]} />

          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: c.text }]}>Balance Due</Text>
            <Text style={[
              styles.totalValue,
              { color: (billing?.current_balance ?? 0) > 0 ? c.danger : c.success }
            ]}>
              ₹{(billing?.current_balance ?? 0).toLocaleString('en-IN')}
            </Text>
          </View>

          {dueDateLabel ? (
            <Text style={[styles.dueDate, { color: c.textMuted }]}>{dueDateLabel}</Text>
          ) : null}
        </View>

        {/* Pay Now Button */}
        {(billing?.current_balance ?? 0) > 0 ? (
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: c.accent }, isPaying && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handlePayNow}
            disabled={isPaying}
          >
            {isPaying ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <IconSymbol name="indianrupeesign.circle.fill" size={22} color="#FFFFFF" />
                <Text style={styles.payButtonText}>
                  Pay ₹{(billing?.current_balance ?? 0).toLocaleString('en-IN')} Now
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.paidBanner, { backgroundColor: c.successLight }]}>
            <IconSymbol name="checkmark.seal.fill" size={22} color={c.success} />
            <Text style={[styles.paidText, { color: c.success }]}>All dues cleared for this month!</Text>
          </View>
        )}

        {/* Payment History */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Payment History</Text>
        {history.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>No payment records found.</Text>
          </View>
        ) : (
          history.map((pay) => (
            <TouchableOpacity
              key={pay.id}
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: '/modal' as any,
                params: {
                  id: pay.id.toString(),
                  amount: pay.amount.toString(),
                  month: pay.month,
                  year: pay.year.toString(),
                  method: pay.payment_method,
                  transaction_id: pay.transaction_id,
                  date: pay.created_at,
                }
              })}
            >
              <View style={[styles.historyCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                <View style={[styles.checkCircle, { backgroundColor: c.successLight }]}>
                  <IconSymbol name="checkmark.circle.fill" size={24} color={c.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyMonth, { color: c.text }]}>
                    {pay.month} {pay.year}
                  </Text>
                  <Text style={[styles.historyMeta, { color: c.textMuted }]}>
                    {formatDate(pay.created_at)} • {pay.payment_method}
                  </Text>
                </View>
                <Text style={[styles.historyAmount, { color: c.success }]}>
                  ₹{pay.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  card: { borderRadius: Radius.lg, padding: Spacing.xxl, marginBottom: Spacing.lg, borderWidth: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.lg },
  billRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: Spacing.md,
  },
  totalRow: { paddingVertical: Spacing.lg },
  billLabel: { fontSize: 15 },
  billValue: { fontSize: 15, fontWeight: '600' },
  totalLabel: { fontSize: 17, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800' },
  divider: { height: StyleSheet.hairlineWidth },
  dueDate: { fontSize: 13, marginTop: Spacing.md, textAlign: 'center' },
  payButton: {
    paddingVertical: 18, borderRadius: Radius.md,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 10, marginBottom: Spacing.lg,
    ...Platform.select({
      ios: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  payButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  paidBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  paidText: { fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.lg, marginTop: Spacing.sm },
  historyCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, padding: Spacing.xl,
    marginBottom: Spacing.md, borderWidth: 1, gap: Spacing.lg,
  },
  checkCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  historyMonth: { fontSize: 15, fontWeight: '700' },
  historyMeta: { fontSize: 12, marginTop: 2 },
  historyAmount: { fontSize: 16, fontWeight: '800' },
  emptyCard: { borderRadius: Radius.lg, padding: Spacing.xxl, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
