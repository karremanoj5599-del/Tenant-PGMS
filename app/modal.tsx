import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PaymentModal() {
  const { 
    id, amount, month, year, method, date, transaction_id, status 
  } = useLocalSearchParams<{
    id: string;
    amount: string;
    month: string;
    year: string;
    method: string;
    date: string;
    transaction_id: string;
    status: string;
  }>();

  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];
  const router = useRouter();

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const DetailRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: color || c.text }]}>{value || '—'}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Success Header */}
        <View style={styles.header}>
          <View style={[styles.statusIcon, { backgroundColor: c.successLight }]}>
            <IconSymbol name="checkmark.circle.fill" size={48} color={c.success} />
          </View>
          <Text style={[styles.successTitle, { color: c.text }]}>Payment Successful</Text>
          <Text style={[styles.amountText, { color: c.text }]}>
            ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.monthText, { color: c.textSecondary }]}>
            Rent for {month} {year}
          </Text>
        </View>

        {/* Transaction Details */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Transaction Details</Text>
          
          <DetailRow label="Transaction Status" value={status || 'Completed'} color={c.success} />
          <View style={[styles.divider, { backgroundColor: c.separator }]} />
          <DetailRow label="Payment Method" value={method || 'UPI'} />
          <View style={[styles.divider, { backgroundColor: c.separator }]} />
          <DetailRow label="Transaction ID" value={transaction_id || `TXN${id}`} />
          <View style={[styles.divider, { backgroundColor: c.separator }]} />
          <DetailRow label="Date & Time" value={formatDate(date || '')} />
        </View>

        {/* Digital Signature / Footer */}
        <View style={styles.footer}>
          <IconSymbol name="checkmark.shield.fill" size={16} color={c.textMuted} />
          <Text style={[styles.footerText, { color: c.textMuted }]}>
            This is a digitally generated receipt for your PG records.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: c.accent }]}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.xl, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  statusIcon: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  successTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  amountText: { fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  monthText: { fontSize: 16, marginTop: 4 },
  card: { borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, marginBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: Spacing.lg },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 40 },
  footerText: { fontSize: 12 },
  closeButton: { paddingVertical: 18, borderRadius: Radius.md, alignItems: 'center' },
  closeButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
