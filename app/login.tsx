import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { login } from '@/services/api';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const c = Colors[colorScheme];
  const router = useRouter();
  const { signIn } = useAuth();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const validate = () => {
    let valid = true;
    setMobileError('');
    setPasswordError('');
    setFormError('');
    if (!mobile.trim() || mobile.trim().length < 10) {
      setMobileError('Enter a valid 10-digit mobile number.');
      valid = false;
    }
    if (!password.trim() || password.trim().length < 4) {
      setPasswordError('Enter your 4-digit PIN or password.');
      valid = false;
    }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const result = await login(mobile.trim(), password.trim());
      if (result.success && result.token) {
        await signIn(result.token, result.tenant);
        router.replace('/(tabs)');
      } else {
        const errorMsg = result.error || 'Invalid credentials.';
        setFormError(errorMsg);
        if (Platform.OS !== 'web') Alert.alert('Login Failed', errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Could not connect to server. Make sure the backend is running.';
      setFormError(errorMsg);
      if (Platform.OS !== 'web') Alert.alert('Login Failed', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Branding */}
          <View style={styles.brandSection}>
            <View style={[styles.logoCircle, { backgroundColor: c.accentLight }]}>
              <Text style={[styles.logoIcon, { color: c.accent }]}>🏠</Text>
            </View>
            <Text style={[styles.appName, { color: c.text }]}>Tenant PGMS</Text>
            <Text style={[styles.appTagline, { color: c.textSecondary }]}>
              Your PG, at your fingertips.
            </Text>
          </View>

          {/* Login Card */}
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Sign In</Text>
            <Text style={[styles.cardSubtitle, { color: c.textSecondary }]}>
              Use your registered mobile number and PIN.
            </Text>

            {formError ? (
              <View style={[styles.formErrorContainer, { backgroundColor: c.danger + '20', borderColor: c.danger }]}>
                <Text style={[styles.formErrorText, { color: c.danger }]}>{formError}</Text>
              </View>
            ) : null}

            {/* Mobile Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Mobile Number</Text>
              <View style={[
                styles.inputWrapper,
                {
                  backgroundColor: c.backgroundTertiary,
                  borderColor: mobileError ? c.danger : c.separator,
                },
              ]}>
                <Text style={[styles.inputPrefix, { color: c.textMuted }]}>+91</Text>
                <View style={[styles.inputDivider, { backgroundColor: c.separator }]} />
                <TextInput
                  style={[styles.input, { color: c.text }]}
                  placeholder="9876543210"
                  placeholderTextColor={c.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={(t) => { setMobile(t); setMobileError(''); }}
                  returnKeyType="next"
                />
              </View>
              {mobileError ? <Text style={[styles.errorText, { color: c.danger }]}>{mobileError}</Text> : null}
            </View>

            {/* Password / PIN Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: c.textSecondary }]}>Password / PIN</Text>
              <View style={[
                styles.inputWrapper,
                {
                  backgroundColor: c.backgroundTertiary,
                  borderColor: passwordError ? c.danger : c.separator,
                },
              ]}>
                <TextInput
                  style={[styles.input, { color: c.text, flex: 1 }]}
                  placeholder="••••"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setPasswordError(''); }}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ color: c.textMuted, fontSize: 14 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={[styles.errorText, { color: c.danger }]}>{passwordError}</Text> : null}
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[
                styles.signInButton,
                { backgroundColor: c.accent },
                isLoading && { opacity: 0.7 },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Demo hint */}
          <View style={[styles.demoHint, { backgroundColor: c.accentLight, borderColor: c.accent + '33' }]}>
            <Text style={[styles.demoTitle, { color: c.accent }]}>🔑 Demo Credentials</Text>
            <Text style={[styles.demoText, { color: c.textSecondary }]}>
              Mobile: <Text style={{ fontWeight: '700', color: c.text }}>9876543210</Text>
            </Text>
            <Text style={[styles.demoText, { color: c.textSecondary }]}>
              PIN: <Text style={{ fontWeight: '700', color: c.text }}>1234</Text>
            </Text>
          </View>

          <Text style={[styles.footer, { color: c.textMuted }]}>
            © 2026 Tenant PGMS · Secure & Encrypted
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl + 8,
    marginTop: Spacing.xxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoIcon: { fontSize: 36 },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
  },
  appTagline: {
    fontSize: 15,
    marginTop: 6,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  cardTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  cardSubtitle: { fontSize: 14, marginTop: 4, marginBottom: Spacing.xl },
  formErrorContainer: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  formErrorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldGroup: { marginBottom: Spacing.lg },
  label: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    height: 52,
  },
  inputPrefix: {
    paddingHorizontal: Spacing.lg,
    fontSize: 15,
    fontWeight: '600',
  },
  inputDivider: { width: 1, height: '60%' },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: { paddingHorizontal: Spacing.lg },
  errorText: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  signInButton: {
    marginTop: Spacing.md,
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  signInText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  demoHint: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  demoTitle: { fontSize: 13, fontWeight: '700', marginBottom: Spacing.sm },
  demoText: { fontSize: 13, marginTop: 2 },
  footer: { textAlign: 'center', fontSize: 12 },
});
