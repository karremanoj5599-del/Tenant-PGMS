/**
 * Frontend Configuration
 * Store publishable keys and non-sensitive environment variables here.
 */

import Constants from 'expo-constants';

import { Platform } from 'react-native';

let host = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';

// For Android emulator, 127.0.0.1 points to the emulator itself, not the PC.
// 10.0.2.2 is the special alias to your host loopback interface (127.0.0.1 on your development machine)
if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
  host = '10.0.2.2';
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || `http://${host === 'localhost' ? '127.0.0.1' : host}:3001/api`;

export const Config = {
  API_BASE,

  // YOUR STRIPE PUBLISHABLE KEY (Insert here)
  STRIPE_PUBLISHABLE_KEY: 'sb_publishable_Z_4atlsatj2Xez3NbW0SPQ_TchzfY5z',

  // If you are migrating to Supabase/Cloud PostgreSQL, put the URL here for the backend
  // (but keep sensitive DB passwords in the backend .env only!)
};
