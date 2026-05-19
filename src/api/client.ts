import type { ControlCenterMeta, ControlCenterOverviewResponse, HealthResponse } from '../types';

const BASE = '/api';

export class ApiRequestError extends Error {
  meta?: ControlCenterMeta;
  code?: string;

  constructor(message: string, meta?: ControlCenterMeta, code?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.meta = meta;
    this.code = code;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  const body = (await res.json().catch(() => ({}))) as T & {
    error?: string;
    meta?: ControlCenterMeta;
    code?: string;
  };

  if (!res.ok) {
    throw new ApiRequestError(
      body.error ?? res.statusText ?? 'Anfrage fehlgeschlagen',
      body.meta,
      body.code,
    );
  }

  return body as T;
}

export const api = {
  getMe: () => request<{ authenticated: boolean; user?: import('../types').SessionUser }>('/auth/me'),
  login: (body?: { email?: string; role?: string }) =>
    request<{ user: import('../types').SessionUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  getConfigStatus: () =>
    request<{
      apiConfigured: boolean;
      apiUrlSet: boolean;
      tokenSet: boolean;
      error: string | null;
    }>('/control-center/config-status'),

  getOverview: () => request<ControlCenterOverviewResponse>('/control-center/overview'),

  getHealth: () =>
    request<HealthResponse & { meta?: ControlCenterMeta }>('/control-center/health'),

  runHealthCheck: async () => api.getHealth(),

  getLogs: (severity?: string) =>
    request<{ logs: import('../types').SystemLog[]; meta?: ControlCenterMeta; message?: string }>(
      `/control-center/logs${severity ? `?severity=${severity}` : ''}`,
    ),

  getTenants: (search?: string) =>
    request<{ tenants: import('../types').Tenant[]; meta?: ControlCenterMeta; message?: string }>(
      `/control-center/tenants${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    ),

  getSubscriptions: () =>
    request<import('../types').SubscriptionSummary & { meta?: ControlCenterMeta }>(
      '/control-center/subscriptions/summary',
    ),

  getSecurity: () =>
    request<import('../types').SecuritySummary & { meta?: ControlCenterMeta }>(
      '/control-center/security/summary',
    ),

  runBackupCheck: () => request<import('../types').BackupStatus>('/control-center/backups/status'),

  startSupportSession: (tenantId: string, reason?: string) =>
    request<{ sessionId: number }>(`/admin/tenants/${tenantId}/support-session/start`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  logControlCenterOpen: () =>
    request<{ ok: boolean }>('/admin/audit/control-center-opened', { method: 'POST' }),
};
