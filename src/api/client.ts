import type { ControlCenterMeta, ControlCenterOverviewResponse, HealthResponse } from '../types';

const BASE = '/api';

export type ApiFail = {
  ok: false;
  error: string;
  message: string;
  meta?: ControlCenterMeta;
  code?: string;
};

export type ApiSuccess<T> = { ok: true; data: T };

export type ApiResult<T> = ApiSuccess<T> | ApiFail;

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

function fail(
  error: string,
  message: string,
  meta?: ControlCenterMeta,
  code?: string,
): ApiFail {
  return { ok: false, error, message, meta, code };
}

async function parseJsonBody(res: Response): Promise<{
  ok: true;
  body: Record<string, unknown>;
} | ApiFail> {
  const text = await res.text();
  if (!text.trim()) {
    return fail('empty_response', 'Die Haupt-App hat eine leere Antwort geliefert.');
  }
  try {
    const body = JSON.parse(text) as Record<string, unknown>;
    return { ok: true, body };
  } catch {
    const preview = text.slice(0, 80).replace(/\s+/g, ' ');
    return fail(
      'invalid_json',
      'Die Haupt-App hat keine gültige JSON-Antwort geliefert.',
      undefined,
      preview.startsWith('<') ? 'html_response' : 'parse_error',
    );
  }
}

async function requestSafe<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options?.headers },
      ...options,
    });

    const parsed = await parseJsonBody(res);
    if (!parsed.ok) {
      const body = parsed as ApiFail;
      if (!res.ok) {
        body.meta = (parsed as ApiFail).meta;
      }
      return parsed;
    }

    const body = parsed.body as T & {
      error?: string;
      message?: string;
      meta?: ControlCenterMeta;
      code?: string;
    };

    if (!res.ok) {
      const errBody = body as { error?: string; message?: string; meta?: ControlCenterMeta; code?: string };
      return fail(
        errBody.code ?? 'request_failed',
        errBody.message ?? (typeof errBody.error === 'string' ? errBody.error : undefined) ?? res.statusText ?? 'Anfrage fehlgeschlagen',
        errBody.meta,
        errBody.code,
      );
    }

    return { ok: true, data: body as T };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Netzwerkfehler';
    if (msg.toLowerCase().includes('fetch')) {
      return fail('network_error', 'Verbindung zum Control-Center-Server fehlgeschlagen.');
    }
    return fail('network_error', msg);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const result = await requestSafe<T>(path, options);
  if (!result.ok) {
    throw new ApiRequestError(result.message, result.meta, result.code);
  }
  return result.data;
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
    requestSafe<{
      apiConfigured: boolean;
      apiUrlSet: boolean;
      tokenSet: boolean;
      error: string | null;
    }>('/control-center/config-status'),

  getOverview: () => requestSafe<ControlCenterOverviewResponse>('/control-center/overview'),

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
