import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useCameraPermissions, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scanMessQR } from '@/services/api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      // Expecting URL like: http://.../mess-scan/{userId}
      let userId = '';
      if (data.includes('/mess-scan/')) {
        const parts = data.split('/mess-scan/');
        userId = parts[parts.length - 1].split('?')[0].replace(/\D/g, ''); // Extract numeric ID
      } else {
        throw new Error('Invalid Mess QR Code');
      }

      if (!userId) throw new Error('Invalid PG Owner ID in QR Code');

      const response = await scanMessQR(userId);
      
      // Navigate back first, then alert
      router.back();

      // Show alert based on response status
      if (response.status === 'success') {
        Alert.alert('✅ Success', response.message);
      } else if (response.status === 'warning') {
        Alert.alert('⚠️ Warning', response.message);
      } else {
        Alert.alert('Mess Check-in', response.message);
      }

    } catch (err: any) {
      Alert.alert('Scan Failed', err?.message || 'Could not process QR code.', [
        { text: 'Try Again', onPress: () => { setScanned(false); setProcessing(false); } },
        { text: 'Cancel', onPress: () => router.back(), style: 'cancel' }
      ]);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={c.accent} />
        <Text style={{ color: c.text, marginTop: 10 }}>Loading camera...</Text>
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={{ color: c.text, marginBottom: 20 }}>No access to camera</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: c.accent, marginBottom: 10 }]} onPress={requestPermission}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: c.cardBorder }]} onPress={() => router.back()}>
          <Text style={{ color: c.text, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Mess QR</Text>
        <View style={{ width: 28 }} />
      </View>
      
      <View style={{ flex: 1, overflow: 'hidden', borderRadius: 20, margin: 10 }}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Overlay mask for scanning area */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.promptText}>
            {processing ? 'Processing...' : 'Align QR code within the frame'}
          </Text>
        </View>

        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={c.accent} />
            <Text style={styles.processingText}>Marking Attendance...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  backBtn: {
    padding: 5,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  promptText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 30,
    fontWeight: '600',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  processingText: {
    color: '#fff',
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
  }
});
