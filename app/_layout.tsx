import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const TenantDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#3B82F6',
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    border: 'rgba(255, 255, 255, 0.06)',
    notification: '#EF4444',
  },
};

const TenantLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3B82F6',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    border: 'rgba(0, 0, 0, 0.06)',
    notification: '#EF4444',
  },
};

/**
 * Auth guard — redirects to /login if not authenticated,
 * and redirects to /(tabs) if already authenticated.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!isLoggedIn && inAuthGroup) {
      // Not signed in, redirect to login
      router.replace('/login');
    } else if (isLoggedIn && segments[0] === 'login') {
      // Already signed in, go to app
      router.replace('/(tabs)');
    }
  }, [isLoggedIn, isLoading, segments]);

  return <>{children}</>;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? TenantDarkTheme : TenantLightTheme}>
      <AuthGuard>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Payment Details' }} />
        </Stack>
      </AuthGuard>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
