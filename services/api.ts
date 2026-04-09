/**
 * API Service Layer
 * Centralized HTTP client for all backend communication
 */

import Constants from 'expo-constants';

import { Config } from '@/constants/Config';

const API_BASE = Config.API_BASE;

let currentTenantId: string | null = null;

export function setAuthToken(token: string | null) {
  currentTenantId = token;
}

export function getAuthToken() {
  return currentTenantId;
}

async function request(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (currentTenantId) {
    headers['x-tenant-id'] = currentTenantId;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(`🔴 API Error [${response.status}] ${endpoint}:`, data.error);
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// ─── Auth ───────────────────────────────────────────
export async function login(mobile: string, password: string) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ mobile, password }),
  });
}

export async function updatePin(oldPin: string, newPin: string) {
  return request('/auth/update-pin', {
    method: 'PUT',
    body: JSON.stringify({ oldPin, newPin }),
  });
}

// ─── Dashboard ──────────────────────────────────────
export async function getDashboard() {
  return request('/dashboard');
}

// ─── Payments ───────────────────────────────────────
export async function getBilling() {
  return request('/payments/billing');
}

export async function getPaymentHistory() {
  return request('/payments/history');
}

export async function recordPayment(data: {
  amount: number;
  month: string;
  year: number;
  payment_method?: string;
  transaction_id?: string;
}) {
  return request('/payments/record', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Tickets ────────────────────────────────────────
export async function getTickets() {
  return request('/tickets');
}

export async function createTicket(category: string, description: string) {
  return request('/tickets', {
    method: 'POST',
    body: JSON.stringify({ category, description }),
  });
}

// ─── Access Logs ────────────────────────────────────
export async function getAccessLogs(limit = 50, offset = 0) {
  return request(`/logs?limit=${limit}&offset=${offset}`);
}
