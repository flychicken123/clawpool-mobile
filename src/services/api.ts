import { getToken } from './auth';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  container_status: string;
  container_port?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ContainerStatus {
  container_status: 'pending' | 'running' | 'error' | 'stopped' | 'deleted';
  container_port?: number;
}

export interface ChatResponse {
  reply: string;
  tokens_used: number;
}

export interface UsageInfo {
  plan: string;
  tokens_used: number;
  tokens_quota: number;
  percentage: number;
  days_remaining: number;
}

export interface Plan {
  name: string;
  price: number;
  price_usd?: number;
  features?: string[];
  tokens_quota?: number;
  tokens_per_month?: number;
}

export interface SubscribeResponse {
  checkout_url?: string;
  url?: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    if (res.status === 429) {
      throw new ApiError(
        'You have reached your monthly limit. Upgrade to continue.',
        429,
      );
    }
    // 402: trial ended or subscription required — pass server message through
    throw new ApiError(body.error || body.message || 'Request failed', res.status);
  }

  return res.json();
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await request<{ success: boolean; data: AuthResponse }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  return res.data;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await request<{ success: boolean; data: AuthResponse }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function googleLogin(params: {
  email: string;
  name: string;
  picture: string;
  google_id: string;
  id_token: string;
}): Promise<AuthResponse> {
  const res = await request<{ success: boolean; data: AuthResponse }>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      token: params.id_token,
      email: params.email,
      name: params.name,
      picture: params.picture,
      google_id: params.google_id,
    }),
  });
  return res.data;
}

export async function getMe(): Promise<{ user: User }> {
  const res = await request<{ success: boolean; data: User }>('/api/auth/me');
  return { user: res.data };
}

export async function getContainerStatus(): Promise<ContainerStatus> {
  const res = await request<{ success: boolean; data: { status: string; port?: number; containerId?: string } }>('/api/container/status');
  // API returns { status, port } but our interface uses container_status
  return {
    container_status: res.data.status as ContainerStatus['container_status'],
    container_port: res.data.port,
  };
}

export async function sendMessage(message: string, imageBase64?: string, imageMimeType?: string): Promise<ChatResponse> {
  const body: Record<string, any> = { message };
  if (imageBase64) {
    body.image_base64 = imageBase64;
    body.image_mime_type = imageMimeType || 'image/jpeg';
  }
  const res = await request<{ success: boolean; data: ChatResponse }>(
    '/api/proxy/chat',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
  return res.data;
}

export async function getUsage(): Promise<UsageInfo> {
  const res = await request<{ success: boolean; data: UsageInfo }>('/api/usage');
  return res.data;
}

export async function getPlans(): Promise<Plan[]> {
  const res = await request<{ success: boolean; data: Plan[] }>('/api/billing/plans');
  return res.data;
}

export async function subscribeToPlan(
  planName: string,
): Promise<SubscribeResponse> {
  const res = await request<{ success: boolean; data: { url: string } }>('/api/billing/subscribe', {
    method: 'POST',
    body: JSON.stringify({ plan: planName }),
  });
  return { checkout_url: res.data?.url, url: res.data?.url };
}

export async function appleSignIn(
  identityToken: string,
  fullName: string,
): Promise<AuthResponse> {
  const res = await request<{ success: boolean; data: AuthResponse }>('/api/auth/apple', {
    method: 'POST',
    body: JSON.stringify({ identityToken, fullName }),
  });
  return res.data;
}

export async function deleteAccount(): Promise<{ success: boolean; message: string }> {
  return request('/api/auth/account', { method: 'DELETE' });
}

export async function verifyIAPReceipt(
  receipt: string,
  productId: string,
): Promise<{ success: boolean; plan: string }> {
  const res = await request<{ success: boolean; plan: string }>('/api/billing/verify-iap', {
    method: 'POST',
    body: JSON.stringify({ receipt, productId }),
  });
  return res;
}
