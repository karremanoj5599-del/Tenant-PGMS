import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Config } from '../../constants/Config';
import QRCode from 'react-native-qrcode-svg';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export default function GuestsScreen() {
  const { tenant, token } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const response = await fetch(`${Config.API_BASE}/visitors`, {
        headers: { 'x-user-id': tenant?.user_id?.toString() || '', 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setVisitors(data.visitors);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createGuestPass = async () => {
    if (!name || !phone || !visitDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    try {
      const response = await fetch(`${Config.API_BASE}/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': tenant?.user_id?.toString() || '', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, phone, visit_date: visitDate, purpose })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Guest pass created successfully');
        setModalVisible(false);
        setName('');
        setPhone('');
        setPurpose('');
        fetchVisitors();
      } else {
        Alert.alert('Error', data.error || 'Failed to create pass');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const showQRCode = (visitor: any) => {
    setSelectedVisitor(visitor);
    setQrModalVisible(true);
  };

  const renderVisitor = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="user-friends" size={20} color="#4f46e5" />
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={styles.visitorName}>{item.name}</Text>
          <Text style={styles.visitorPhone}>{item.phone}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'Checked In' ? '#10b98120' : '#f59e0b20' }]}>
          <Text style={[styles.statusText, { color: item.status === 'Checked In' ? '#10b981' : '#f59e0b' }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}><Ionicons name="calendar-outline" size={14} /> {new Date(item.visit_date).toLocaleDateString()}</Text>
        <TouchableOpacity style={styles.qrButton} onPress={() => showQRCode(item)}>
          <Ionicons name="qr-code-outline" size={16} color="#fff" />
          <Text style={styles.qrButtonText}>Show QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guest Passes</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
      ) : visitors.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="id-badge" size={60} color="#94a3b8" />
          <Text style={styles.emptyText}>No guest passes yet</Text>
          <Text style={styles.emptySubtext}>Create one for your incoming visitors</Text>
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderVisitor}
          contentContainerStyle={{ padding: 20 }}
          refreshing={loading}
          onRefresh={fetchVisitors}
        />
      )}

      {/* Create Guest Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Guest Pass</Text>
            
            <TextInput style={styles.input} placeholder="Guest Name" value={name} onChangeText={setName} placeholderTextColor="#94a3b8" />
            <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#94a3b8" />
            <TextInput style={styles.input} placeholder="Visit Date (YYYY-MM-DD)" value={visitDate} onChangeText={setVisitDate} placeholderTextColor="#94a3b8" />
            <TextInput style={styles.input} placeholder="Purpose (Optional)" value={purpose} onChangeText={setPurpose} placeholderTextColor="#94a3b8" />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={createGuestPass}>
                <Text style={styles.submitButtonText}>Generate Pass</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      {/* QR Code Modal */}
      <Modal visible={qrModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.qrTitle}>Entry Pass for {selectedVisitor?.name}</Text>
            <Text style={styles.qrSubtitle}>Show this QR to the security guard</Text>
            
            <View style={styles.qrWrapper}>
              {selectedVisitor && (
                <QRCode
                  value={selectedVisitor.pass_code}
                  size={200}
                  color="black"
                  backgroundColor="white"
                />
              )}
            </View>
            
            <Text style={styles.passCodeText}>Code: {selectedVisitor?.pass_code}</Text>
            
            <TouchableOpacity style={styles.closeQrButton} onPress={() => setQrModalVisible(false)}>
              <Text style={styles.closeQrText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  addButton: { backgroundColor: '#4f46e5', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: '#475569', marginTop: 20 },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#4f46e515', justifyContent: 'center', alignItems: 'center' },
  visitorName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  visitorPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  dateText: { fontSize: 14, color: '#64748b' },
  qrButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4f46e5', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  qrButtonText: { color: '#fff', fontSize: 13, fontWeight: '600', marginLeft: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16, color: '#1e293b' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelButton: { padding: 15, marginRight: 10 },
  cancelButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  submitButton: { backgroundColor: '#4f46e5', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 12 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  qrModalContent: { backgroundColor: '#fff', width: '90%', borderRadius: 24, padding: 30, alignItems: 'center' },
  qrTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  qrSubtitle: { fontSize: 14, color: '#64748b', marginTop: 5, marginBottom: 30, textAlign: 'center' },
  qrWrapper: { padding: 20, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 20 },
  passCodeText: { fontSize: 24, fontWeight: 'bold', color: '#4f46e5', letterSpacing: 2, marginBottom: 30 },
  closeQrButton: { backgroundColor: '#f1f5f9', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  closeQrText: { color: '#475569', fontSize: 16, fontWeight: '600' }
});
