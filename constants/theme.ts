/**
 * Tenant PGMS - Premium Dark Theme Design System
 * A curated color palette inspired by modern fintech and proptech apps.
 */

import { Platform } from 'react-native';

// Primary Accent - Vivid Blue
const accentPrimary = '#3B82F6';
const accentSecondary = '#60A5FA';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    background: '#F8FAFC',
    backgroundSecondary: '#FFFFFF',
    backgroundTertiary: '#E2E8F0',
    tint: accentPrimary,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: accentPrimary,
    card: '#FFFFFF',
    cardBorder: 'rgba(0, 0, 0, 0.06)',
    accent: accentPrimary,
    accentLight: '#EFF6FF',
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    separator: '#E2E8F0',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    backgroundTertiary: '#334155',
    tint: accentSecondary,
    icon: '#64748B',
    tabIconDefault: '#475569',
    tabIconSelected: accentSecondary,
    card: '#1E293B',
    cardBorder: 'rgba(255, 255, 255, 0.06)',
    accent: accentPrimary,
    accentLight: 'rgba(59, 130, 246, 0.15)',
    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.15)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.15)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    separator: 'rgba(255, 255, 255, 0.06)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
