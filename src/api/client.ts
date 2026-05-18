const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? 'Anfrage fehlgeschlagen');
  }

  return res.json() as Promise<T>;
}

export const api = {
  getMe: () => request<{ authenticated: boolean; user?: import('../types').SessionUser }>('/auth/me'),
  login: (body?: { email?: string; role?: string }) =>
    request<{ user: import('../types').SessionUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  getOverview: () => request<import('../types').OverviewData>('/admin/control-center/overview'),
  getHealth: () => request<import('../types').HealthResponse>('/admin/health'),
  runHealthCheck: () =>
    request<import('../types').HealthResponse>('/admin/health/run-check', { method: 'POST' }),
  getCharts: (period: string) =>
    request<{ period: string; data: import('../types').ChartPoint[] }>(
      `/admin/charts?period=${period}`,
    ),
  getLogs: (severity?: string) =>
    request<{ logs: import('../types').SystemLog[] }>(
      `/admin/logs${severity ? `?severity=${severity}` : ''}`,
    ),
  getTenants: (search?: string) =>
    request<{ tenants: import('../types').Tenant[] }>(
      `/admin/tenants${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    ),
  runBackupCheck: () => request<unknown>('/admin/backups/run-check', { method: 'POST' }),
  startSupportSession: (tenantId: string, reason?: string) =>
    request<{ sessionId: number }>(`/admin/tenants/${tenantId}/support-session/start`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  logControlCenterOpen: () =>
    request<{ ok: boolean }>('/admin/audit/control-center-opened', { method: 'POST' }),
};
