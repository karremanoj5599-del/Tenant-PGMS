import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol, IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import api, { updatePin, getDashboard } from '@/services/api';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];
  const { tenant: authTenant, signOut } = useAuth();

  const [fullTenant, setFullTenant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // PIN Update state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Bed Reallocation state
  const [bedRequestReason, setBedRequestReason] = useState('');
  const [isRequestingBed, setIsRequestingBed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboard();
        setFullTenant(data.tenant);
      } catch (err) {
        console.error('Failed to fetch full profile:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleUpdatePin = async () => {
    console.log('🔄 PIN Update initiated...');
    if (!oldPin || !newPin || !confirmPin) {
      if (Platform.OS === 'web') alert('Please fill all fields.');
      else Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    if (newPin !== confirmPin) {
      if (Platform.OS === 'web') alert('New PIN and confirmation do not match.');
      else Alert.alert('Error', 'New PIN and confirmation do not match.');
      return;
    }
    if (newPin.length < 4) {
      if (Platform.OS === 'web') alert('PIN must be at least 4 digits.');
      else Alert.alert('Error', 'PIN must be at least 4 digits.');
      return;
    }

    setIsUpdating(true);
    try {
      await updatePin(oldPin, newPin);
      console.log('✅ PIN Updated');
      if (Platform.OS === 'web') alert('Your security PIN has been updated successfully.');
      else Alert.alert('Success', 'Your security PIN has been updated successfully.');
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      const msg = err?.message || 'Could not update PIN.';
      console.error('❌ PIN Update failed:', msg);
      if (Platform.OS === 'web') alert('Update Failed: ' + msg);
      else Alert.alert('Update Failed', msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBedChangeRequest = async () => {
    if (!bedRequestReason) {
      if (Platform.OS === 'web') alert('Please provide a reason or preference.');
      else Alert.alert('Error', 'Please provide a reason or preference.');
      return;
    }
    setIsRequestingBed(true);
    try {
      // Create a ticket with 'Bed Change' category
      await api.post('/tickets/create', {
        category: 'Bed Reallocation',
        description: bedRequestReason
      });
      if (Platform.OS === 'web') alert('Your bed change request has been submitted to the admin.');
      else Alert.alert('Success', 'Your bed change request has been submitted to the admin.');
      setBedRequestReason('');
    } catch (err: any) {
      const msg = err?.message || 'Could not submit request.';
      if (Platform.OS === 'web') alert('Failed: ' + msg);
      else Alert.alert('Request Failed', msg);
    } finally {
      setIsRequestingBed(false);
    }
  };

  const handleSignOut = () => {
    console.log('🚪 Sign out requested');
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to log out?')) {
        signOut();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]);
    }
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: IconSymbolName }) => (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconBg, { backgroundColor: c.backgroundTertiary }]}>
        <IconSymbol name={icon} size={18} color={c.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: c.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: c.text }]}>{value || '—'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: c.accentLight }]}>
              <Text style={[styles.avatarText, { color: c.accent }]}>
                {authTenant?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.name, { color: c.text }]}>{authTenant?.name}</Text>
            <Text style={[styles.mobile, { color: c.textSecondary }]}>+91 {authTenant?.mobile}</Text>
          </View>

          {/* Details Card */}
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Tenant Information</Text>
            {isLoading ? (
              <ActivityIndicator color={c.accent} style={{ marginVertical: 20 }} />
            ) : (
              <>
                <InfoRow label="Room Number" value={fullTenant?.room_number} icon="house.fill" />
                <View style={[styles.divider, { backgroundColor: c.separator }]} />
                <InfoRow label="Bed Layout" value={`${fullTenant?.bed_number} Bed`} icon="bed.double.fill" />
                <View style={[styles.divider, { backgroundColor: c.separator }]} />
                <InfoRow label="Joining Date" value={fullTenant?.joining_date} icon="calendar" />
                <View style={[styles.divider, { backgroundColor: c.separator }]} />
                <InfoRow label="Status" value={fullTenant?.access_status === 'active' ? 'Verified' : 'Pending'} icon="checkmark.shield.fill" />
              </>
            )}
          </View>

          {/* Room Services Card */}
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Room Services</Text>
            
            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Request Bed/Room Change</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.backgroundTertiary, color: c.text, borderColor: c.separator }]}
              placeholder="E.g., I would like to move to Room 102..."
              placeholderTextColor={c.textMuted}
              value={bedRequestReason}
              onChangeText={setBedRequestReason}
            />

            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: c.accent }, isRequestingBed && { opacity: 0.7 }]}
              onPress={handleBedChangeRequest}
              disabled={isRequestingBed}
            >
              {isRequestingBed ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Security Card */}
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Update Security PIN</Text>
            
            <Text style={[styles.inputLabel, { color: c.textMuted }]}>Current PIN</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.backgroundTertiary, color: c.text, borderColor: c.separator }]}
              placeholder="••••"
              placeholderTextColor={c.textMuted}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              value={oldPin}
              onChangeText={setOldPin}
            />

            <Text style={[styles.inputLabel, { color: c.textMuted, marginTop: 12 }]}>New PIN</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.backgroundTertiary, color: c.text, borderColor: c.separator }]}
              placeholder="••••"
              placeholderTextColor={c.textMuted}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              value={newPin}
              onChangeText={setNewPin}
            />

            <Text style={[styles.inputLabel, { color: c.textMuted, marginTop: 12 }]}>Confirm New PIN</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.backgroundTertiary, color: c.text, borderColor: c.separator }]}
              placeholder="••••"
              placeholderTextColor={c.textMuted}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              value={confirmPin}
              onChangeText={setConfirmPin}
            />

            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: c.accent }, isUpdating && { opacity: 0.7 }]}
              onPress={handleUpdatePin}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.updateButtonText}>Change PIN</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.signOutBtn, { borderColor: c.danger }]}
            onPress={handleSignOut}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color={c.danger} />
            <Text style={[styles.signOutText, { color: c.danger }]}>Sign Out from Account</Text>
          </TouchableOpacity>

          <Text style={[styles.version, { color: c.textMuted }]}>
            Tenant PGMS App v1.0.0
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 120 },
  header: { alignItems: 'center', marginBottom: Spacing.xxl, marginTop: Spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  avatarText: { fontSize: 32, fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '800' },
  mobile: { fontSize: 16, marginTop: 4 },
  card: { borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.xl, borderWidth: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.xl },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  infoIconBg: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 12, fontWeight: '600' },
  infoValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.md },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderRadius: Radius.sm, padding: Spacing.lg, fontSize: 16, borderWidth: 1 },
  updateButton: { marginTop: Spacing.xl, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center' },
  updateButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  signOutBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 8, paddingVertical: 16, borderRadius: Radius.md, 
    borderWidth: 1, marginTop: Spacing.lg 
  },
  signOutText: { fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 32 },
});
