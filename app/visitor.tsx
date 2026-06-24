import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getVisitors, inviteVisitor } from '@/services/api';

export default function VisitorScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];
  const router = useRouter();

  const [visitors, setVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [purpose, setPurpose] = useState('');

  const fetchVisitors = useCallback(async () => {
    try {
      const data = await getVisitors();
      setVisitors(data.visitors || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  const handleInvite = async () => {
    if (!name || !phone || !date) {
      Alert.alert('Error', 'Please fill name, phone, and date.');
      return;
    }
    setIsSubmitting(true);
    try {
      await inviteVisitor({ name, phone, date, purpose });
      Alert.alert('Success', 'Visitor pass generated!');
      setName(''); setPhone(''); setDate(''); setPurpose('');
      fetchVisitors();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not generate pass.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Visitor Management</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Invite Guest</Text>
          
          <Text style={[styles.label, { color: c.textSecondary }]}>Guest Name</Text>
          <TextInput style={[styles.input, { backgroundColor: c.backgroundTertiary, color: c.text, borderColor: c.separator }]} placeholder="John Doe" placeholderTextColor={c.textMuted} value={name} onChangeText={setName} />
          
          <Text style={[styles.label, { color: c.textSecondary }]}>Phone Number</Text>
          <TextInput style={[styles.input, { backgroundColor: c.backgroundTertiary, color: c.text, borderColor: c.separator }]} placeholder="9876543210" keyboardType="phone-pad" placeholderTextColor={c.textMuted} value={phone} onChangeText={setPhone} />
          
          <Text style={[styles.label, { color: c.textSecondary }]}>Date of Visit (YYYY-MM-DD)</Text>
          <TextInput style={[styles.input, { backgroundColor: c.backgroundTertiary, color: c.text, borderColor: c.separator }]} placeholder="2026-07-01" placeholderTextColor={c.textMuted} value={date} onChangeText={setDate} />
          
          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: c.accent }]} onPress={handleInvite} disabled={isSubmitting}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Generate Pass</Text>}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Visitors</Text>
        {isLoading ? <ActivityIndicator color={c.accent} /> : visitors.length === 0 ? (
          <Text style={{ color: c.textMuted, textAlign: 'center' }}>No visitors found.</Text>
        ) : (
          visitors.map(v => (
            <View key={v.id} style={[styles.visitorCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View>
                <Text style={[styles.vName, { color: c.text }]}>{v.name}</Text>
                <Text style={[styles.vDate, { color: c.textSecondary }]}>{v.date} • {v.phone}</Text>
              </View>
              <View style={[styles.passCodeBadge, { backgroundColor: c.accentLight }]}>
                <Text style={[styles.passCodeText, { color: c.accent }]}>PIN: {v.passCode}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, paddingTop: Spacing.md },
  backBtn: { padding: 8, marginRight: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: Spacing.xl, paddingBottom: 60 },
  card: { borderRadius: Radius.lg, padding: Spacing.xl, marginBottom: Spacing.xxl, borderWidth: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderRadius: Radius.sm, padding: Spacing.lg, fontSize: 15, borderWidth: 1 },
  submitBtn: { marginTop: Spacing.xl, paddingVertical: 16, borderRadius: Radius.md, alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.lg },
  visitorCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing.md },
  vName: { fontSize: 16, fontWeight: '600' },
  vDate: { fontSize: 13, marginTop: 4 },
  passCodeBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  passCodeText: { fontSize: 14, fontWeight: '700' },
});
