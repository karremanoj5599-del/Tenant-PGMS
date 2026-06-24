/**
 * Auth Context - Manages login/logout state globally
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '@/services/api';

interface TenantInfo {
  id: number;
  name: string;
  mobile: string;
  room?: string;
  bed?: string;
  sharing?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  tenant: TenantInfo | null;
  token: string | null;
  signIn: (token: string, tenant: TenantInfo) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  tenant: null,
  token: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);

  // Restore session on app launch
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedTenant = await AsyncStorage.getItem('auth_tenant');

        if (storedToken && storedTenant) {
          // MIGRATE: If the token looks like a JWT (long string), clear it
          // The new system uses raw tenant IDs which are short.
          if (storedToken.length > 50) {
            console.log('🧹 Clearing stale JWT token...');
            await AsyncStorage.removeItem('auth_token');
            await AsyncStorage.removeItem('auth_tenant');
            setAuthToken(null);
          } else {
            setToken(storedToken);
            setTenant(JSON.parse(storedTenant));
            setAuthToken(storedToken);
          }
        }
      } catch (e) {
        console.error('Failed to restore auth session:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Sync token to API module (important for Hot Module Reloading)
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const signIn = async (newToken: string, tenantInfo: TenantInfo) => {
    setToken(newToken);
    setTenant(tenantInfo);
    setAuthToken(newToken);
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('auth_tenant', JSON.stringify(tenantInfo));
  };

  const signOut = async () => {
    setToken(null);
    setTenant(null);
    setAuthToken(null);
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_tenant');
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!token,
        isLoading,
        tenant,
        token,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
