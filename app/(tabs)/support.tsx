import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getTickets, createTicket } from '@/services/api';

type TicketStatus = 'Pending' | 'In Progress' | 'Resolved';
type TicketCategory = 'Electrical' | 'Plumbing' | 'Cleaning' | 'Other';

interface Ticket {
  id: number;
  category: TicketCategory;
  description: string;
  status: TicketStatus;
  admin_notes?: string;
  created_at: string;
}

const CATEGORIES: TicketCategory[] = ['Electrical', 'Plumbing', 'Cleaning', 'Other'];

export default function SupportScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];

  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const result = await getTickets();
      setTickets(result.tickets ?? []);
    } catch (err: any) {
      if (!silent) Alert.alert('Error', err?.message || 'Failed to load tickets.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const onRefresh = () => { setRefreshing(true); fetchTickets(true); };

  const handleSubmit = async () => {
    if (!selectedCategory || !description.trim()) return;
    setIsSubmitting(true);
    try {
      await createTicket(selectedCategory, description.trim());
      Alert.alert('✅ Ticket Submitted', 'Your support request has been sent. We will get back to you shortly.');
      setSelectedCategory(null);
      setDescription('');
      fetchTickets(true);
    } catch (err: any) {
      Alert.alert('Submit Failed', err?.message || 'Could not submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'Pending': return { bg: c.warningLight, text: c.warning };
      case 'In Progress': return { bg: c.accentLight, text: c.accent };
      case 'Resolved': return { bg: c.successLight, text: c.success };
    }
  };

  const getCategoryIcon = (cat: TicketCategory) => {
    switch (cat) {
      case 'Electrical': return 'bolt.fill';
      case 'Plumbing': return 'drop.fill';
      case 'Cleaning': return 'sparkles';
      default: return 'ellipsis.circle.fill';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.accent }]}>Support</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Raise maintenance or service requests.
          </Text>
        </View>

        {/* New Ticket Form */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>New Request</Text>

          {/* Category Selector */}
          <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === cat ? c.accentLight : c.backgroundTertiary,
                    borderColor: selectedCategory === cat ? c.accent : 'transparent',
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <IconSymbol name={getCategoryIcon(cat)} size={16} color={selectedCategory === cat ? c.accent : c.textMuted} />
                <Text style={[styles.categoryText, { color: selectedCategory === cat ? c.accent : c.textSecondary }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description Input */}
          <Text style={[styles.fieldLabel, { color: c.textSecondary, marginTop: Spacing.lg }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: c.backgroundTertiary, color: c.text, borderColor: c.separator }]}
            placeholder="Describe your issue..."
            placeholderTextColor={c.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: (selectedCategory && description.trim() && !isSubmitting) ? c.accent : c.backgroundTertiary },
            ]}
            disabled={!selectedCategory || !description.trim() || isSubmitting}
            activeOpacity={0.85}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={[styles.submitText, { color: (selectedCategory && description.trim()) ? '#FFFFFF' : c.textMuted }]}>
                Submit Request
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Existing Tickets */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          Previous Tickets {tickets.length > 0 ? `(${tickets.length})` : ''}
        </Text>

        {isLoading && tickets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <ActivityIndicator color={c.accent} />
          </View>
        ) : tickets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>No tickets raised yet.</Text>
          </View>
        ) : (
          tickets.map((ticket) => {
            const statusColor = getStatusColor(ticket.status);
            return (
              <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketCategoryRow}>
                    <IconSymbol name={getCategoryIcon(ticket.category)} size={16} color={c.accent} />
                    <Text style={[styles.ticketCategory, { color: c.text }]}>{ticket.category}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.text }]}>{ticket.status}</Text>
                  </View>
                </View>
                <Text style={[styles.ticketDesc, { color: c.textSecondary }]}>{ticket.description}</Text>
                {ticket.admin_notes ? (
                  <View style={[styles.adminNoteBox, { backgroundColor: c.accentLight }]}>
                    <Text style={[styles.adminNoteLabel, { color: c.accent }]}>Admin Note:</Text>
                    <Text style={[styles.adminNoteText, { color: c.textSecondary }]}>{ticket.admin_notes}</Text>
                  </View>
                ) : null}
                <Text style={[styles.ticketDate, { color: c.textMuted }]}>{formatDate(ticket.created_at)}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.xl, paddingBottom: 100 },
  header: { marginBottom: Spacing.xxl },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: Radius.lg, padding: Spacing.xxl, marginBottom: Spacing.xxl, borderWidth: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: Radius.sm, borderWidth: 1.5,
  },
  categoryText: { fontSize: 13, fontWeight: '600' },
  textArea: {
    borderRadius: Radius.md, padding: Spacing.lg,
    fontSize: 15, minHeight: 100, borderWidth: 1,
  },
  submitButton: {
    marginTop: Spacing.lg, paddingVertical: 16,
    borderRadius: Radius.md, alignItems: 'center', minHeight: 52,
    justifyContent: 'center',
  },
  submitText: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.lg },
  emptyCard: { borderRadius: Radius.lg, padding: Spacing.xxl, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  ticketCard: {
    borderRadius: Radius.lg, padding: Spacing.xl,
    marginBottom: Spacing.md, borderWidth: 1,
  },
  ticketHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.sm,
  },
  ticketCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticketCategory: { fontSize: 15, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.sm },
  statusText: { fontSize: 11, fontWeight: '700' },
  ticketDesc: { fontSize: 14, lineHeight: 20 },
  adminNoteBox: { marginTop: Spacing.sm, borderRadius: Radius.sm, padding: Spacing.md },
  adminNoteLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  adminNoteText: { fontSize: 13 },
  ticketDate: { fontSize: 12, marginTop: Spacing.sm },
});
