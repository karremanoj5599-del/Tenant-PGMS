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
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboard, submitVacateNotice, createTicket } from '@/services/api';

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
    advance_vacate_date?: string | null;
  };
  billing: {
    current_balance: number;
    month: string;
    year: number;
    total_due: number;
    amount_paid: number;
  } | null;
  notices: {
    id: number;
    title: string;
    message: string;
    date: string;
    type: 'warning' | 'info' | 'success';
  }[] | null;
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

  // Stay Management States
  const [isVacateModalOpen, setIsVacateModalOpen] = useState(false);
  const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false);
  
  const [vacateDateInput, setVacateDateInput] = useState('');
  const [isSubmittingVacate, setIsSubmittingVacate] = useState(false);
  
  const [sharingType, setSharingType] = useState('2 Sharing');
  const [shiftDate, setShiftDate] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isSubmittingReallocate, setIsSubmittingReallocate] = useState(false);

  const handleVacateSubmit = async () => {
    if (!vacateDateInput) {
      Alert.alert('Error', 'Please enter a vacate date.');
      return;
    }
    // Simple regex check for YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(vacateDateInput)) {
      Alert.alert('Error', 'Please enter date in YYYY-MM-DD format.');
      return;
    }

    setIsSubmittingVacate(true);
    try {
      await submitVacateNotice(vacateDateInput);
      Alert.alert('✅ Notice Submitted', 'Your vacate date has been recorded. Admin has been notified.');
      setIsVacateModalOpen(false);
      setVacateDateInput('');
      fetchDashboard(true);
    } catch (err: any) {
      Alert.alert('Submit Failed', err?.message || 'Could not submit vacate notice.');
    } finally {
      setIsSubmittingVacate(false);
    }
  };

  const handleReallocateSubmit = async () => {
    if (!shiftDate || !changeReason.trim()) {
      Alert.alert('Error', 'Please fill in target shift date and reason.');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(shiftDate)) {
      Alert.alert('Error', 'Please enter shift date in YYYY-MM-DD format.');
      return;
    }

    setIsSubmittingReallocate(true);
    try {
      const description = `[Bed Reallocation Request]\nPreferred sharing: ${sharingType}\nTarget move date: ${shiftDate}\nReason: ${changeReason.trim()}`;
      await createTicket('Bed Reallocation', description);
      Alert.alert('✅ Request Sent', 'Your bed reallocation request has been submitted to support tickets.');
      setIsReallocateModalOpen(false);
      setShiftDate('');
      setChangeReason('');
    } catch (err: any) {
      Alert.alert('Submit Failed', err?.message || 'Could not submit reallocation request.');
    } finally {
      setIsSubmittingReallocate(false);
    }
  };

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
  const advanceVacateDate = data?.tenant?.advance_vacate_date ?? authTenant?.advance_vacate_date ?? null;

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

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: c.card, borderColor: c.cardBorder }]}
            onPress={() => router.push('/scan' as any)}
          >
            <View style={[styles.actionIconBg, { backgroundColor: c.accentLight }]}>
              <IconSymbol name="qrcode.viewfinder" size={20} color={c.accent} />
            </View>
            <Text style={[styles.actionText, { color: c.text }]}>Scan Mess QR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: c.card, borderColor: c.cardBorder }]}
            onPress={() => router.push('/visitor' as any)}
          >
            <View style={[styles.actionIconBg, { backgroundColor: c.accentLight }]}>
              <IconSymbol name="person.badge.plus.fill" size={20} color={c.accent} />
            </View>
            <Text style={[styles.actionText, { color: c.text }]}>Invite Guest</Text>
          </TouchableOpacity>
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

        {/* Stay Management Card */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Stay Management</Text>
          {advanceVacateDate ? (
            <View style={[styles.vacateAlert, { backgroundColor: c.warningLight, borderColor: c.warning }]}>
              <IconSymbol name="exclamationmark.triangle.fill" size={18} color={c.warning} />
              <Text style={[styles.vacateAlertText, { color: c.text }]}>
                Notice submitted. Scheduled to vacate on <Text style={{ fontWeight: '700' }}>{formatDate(advanceVacateDate)}</Text>.
              </Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.md }}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: c.accent }]}
                onPress={() => setIsVacateModalOpen(true)}
              >
                <IconSymbol name="calendar" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>Schedule Move Out (Vacate)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: c.backgroundTertiary, borderWidth: 1, borderColor: c.separator }]}
                onPress={() => setIsReallocateModalOpen(true)}
              >
                <IconSymbol name="bed.double.fill" size={18} color={c.text} />
                <Text style={[styles.actionButtonText, { color: c.text }]}>Request Bed Change</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Vacate Date Modal */}
        <Modal
          visible={isVacateModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsVacateModalOpen(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Vacate Notice</Text>
              <Text style={{ color: c.textSecondary, fontSize: 13, marginBottom: Spacing.md }}>
                Please provide your planned date of departure. Note that this cannot be undone without contacting administration.
              </Text>

              <Text style={[styles.modalLabel, { color: c.textSecondary }]}>Vacate Date (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: c.backgroundTertiary, color: c.text, borderColor: c.separator }]}
                placeholder="2026-07-31"
                placeholderTextColor={c.textMuted}
                value={vacateDateInput}
                onChangeText={setVacateDateInput}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: c.backgroundTertiary }]}
                  onPress={() => { setIsVacateModalOpen(false); setVacateDateInput(''); }}
                >
                  <Text style={[styles.modalBtnText, { color: c.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: c.accent }]}
                  onPress={handleVacateSubmit}
                  disabled={isSubmittingVacate}
                >
                  {isSubmittingVacate ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Submit Notice</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Bed Reallocation Modal */}
        <Modal
          visible={isReallocateModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsReallocateModalOpen(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Bed Reallocation Request</Text>
              
              {/* Sharing Selector */}
              <Text style={[styles.modalLabel, { color: c.textSecondary }]}>Preferred Room Type</Text>
              <View style={styles.sharingSelection}>
                {['Single', '2 Sharing', '3 Sharing', '4 Sharing'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.sharingChip,
                      {
                        backgroundColor: sharingType === type ? c.accentLight : c.backgroundTertiary,
                        borderColor: sharingType === type ? c.accent : 'transparent',
                      },
                    ]}
                    onPress={() => setSharingType(type)}
                  >
                    <Text style={[styles.sharingChipText, { color: sharingType === type ? c.accent : c.textSecondary }]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalLabel, { color: c.textSecondary }]}>Preferred Shift Date (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: c.backgroundTertiary, color: c.text, borderColor: c.separator }]}
                placeholder="2026-07-31"
                placeholderTextColor={c.textMuted}
                value={shiftDate}
                onChangeText={setShiftDate}
              />

              <Text style={[styles.modalLabel, { color: c.textSecondary }]}>Reason for Reallocation</Text>
              <TextInput
                style={[
                  styles.modalInput, 
                  { 
                    backgroundColor: c.backgroundTertiary, 
                    color: c.text, 
                    borderColor: c.separator,
                    minHeight: 80,
                    textAlignVertical: 'top'
                  }
                ]}
                placeholder="Why do you want to change your bed? (e.g. want smaller sharing capacity, change floor, roommate issues)"
                placeholderTextColor={c.textMuted}
                multiline
                numberOfLines={3}
                value={changeReason}
                onChangeText={setChangeReason}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: c.backgroundTertiary }]}
                  onPress={() => { setIsReallocateModalOpen(false); setShiftDate(''); setChangeReason(''); }}
                >
                  <Text style={[styles.modalBtnText, { color: c.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: c.accent }]}
                  onPress={handleReallocateSubmit}
                  disabled={isSubmittingReallocate}
                >
                  {isSubmittingReallocate ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Send Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Notices Section */}
        {data?.notices && data.notices.length > 0 && (
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Notice Board</Text>
            {data.notices.map((notice, index) => (
              <View key={notice.id}>
                <View style={styles.noticeItem}>
                  <View style={[
                    styles.noticeIconBg, 
                    { backgroundColor: notice.type === 'warning' ? c.warningLight : notice.type === 'success' ? c.successLight : c.accentLight }
                  ]}>
                    <IconSymbol 
                      name={notice.type === 'warning' ? 'exclamationmark.triangle.fill' : notice.type === 'success' ? 'checkmark.circle.fill' : 'info.circle.fill'} 
                      size={18} 
                      color={notice.type === 'warning' ? c.warning : notice.type === 'success' ? c.success : c.accent} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.noticeTitle, { color: c.text }]}>{notice.title}</Text>
                    <Text style={[styles.noticeMessage, { color: c.textSecondary }]}>{notice.message}</Text>
                    <Text style={[styles.noticeDate, { color: c.textMuted }]}>{formatDate(notice.date)}</Text>
                  </View>
                </View>
                {index < data.notices!.length - 1 && <View style={[styles.divider, { backgroundColor: c.separator }]} />}
              </View>
            ))}
          </View>
        )}

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
  quickActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  actionBtn: { flex: 1, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  actionText: { fontSize: 13, fontWeight: '600' },
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
  noticeItem: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.sm },
  noticeIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  noticeTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  noticeMessage: { fontSize: 14, lineHeight: 20 },
  noticeDate: { fontSize: 12, marginTop: 6, fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.md },
  signOutButton: {
    marginTop: Spacing.md, paddingVertical: 14, borderRadius: Radius.md,
    borderWidth: 1, alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '600' },
  vacateAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  vacateAlertText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  modalInput: {
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    fontSize: 15,
    borderWidth: 1,
  },
  sharingSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sharingChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
  },
  sharingChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
