import {
  getRabbitStationConfig,
  rabbitStationFetch,
  rabbitStationPatch,
  rabbitStationPost,
  RabbitStationApiError,
} from './rabbitStationApiClient.js';
import type { SupportAccessMode, SupportSession, SupportSessionStartResult } from '../types.js';
import {
  emptyCharts,
  mapBackupStatus,
  mapHealth,
  mapLogs,
  mapSecuritySummary,
  mapSubscriptionSummary,
  mapSystemInfo,
  mapTenants,
} from './rabbitStationMappers.js';
import type { ControlCenterMeta, OverviewData } from '../types.js';
import { applyTenantActivityFromLogs } from './logFormat.js';
import { refineHealthComponents } from './healthDisplay.js';

export type LoadResult = {
  data: OverviewData;
  meta: ControlCenterMeta;
};

export function buildErrorMeta(lastError?: string): ControlCenterMeta {
  const cfg = getRabbitStationConfig();
  return {
    source: 'error',
    apiConfigured: cfg.ready,
    apiUrlSet: cfg.ready ? true : cfg.apiUrlSet,
    tokenSet: cfg.ready ? true : cfg.tokenSet,
    message: cfg.ready
      ? 'RabbitStation Haupt-App ist nicht verbunden.'
      : 'Bitte RABBITSTATION_API_URL und CONTROL_CENTER_API_TOKEN konfigurieren.',
    lastError,
  };
}

async function fetchLiveHealthBundle(): Promise<{
  health: OverviewData['health'];
  backups: OverviewData['backups'];
  systemInfo: OverviewData['systemInfo'];
  responseTimeMs: number;
}> {
  const t0 = Date.now();
  const [healthRaw, backupsRaw] = await Promise.all([
    rabbitStationFetch<Record<string, unknown>>('/api/admin/health'),
    rabbitStationFetch<Record<string, unknown>>('/api/admin/backups/status'),
  ]);
  const responseTimeMs = Date.now() - t0;
  const backups = mapBackupStatus(backupsRaw);
  const health = mapHealth(healthRaw, backupsRaw, responseTimeMs, true);
  return {
    health,
    backups,
    systemInfo: mapSystemInfo(healthRaw),
    responseTimeMs,
  };
}

export async function fetchLiveHealth() {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  return fetchLiveHealthBundle();
}

export async function fetchLiveTenants() {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  const data = await rabbitStationFetch<{ tenants: Record<string, unknown>[] }>('/api/admin/tenants');
  const tenants = mapTenants((data.tenants ?? []) as Parameters<typeof mapTenants>[0]);
  return { tenants };
}

export async function fetchLiveSubscriptions() {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  const data = await rabbitStationFetch<{
    byStatus?: { subscription_status: string; c: number }[];
    expiringTrials?: unknown[];
  }>('/api/admin/subscriptions/summary');
  const { tenants } = await fetchLiveTenants();
  return { subscriptions: mapSubscriptionSummary(data, tenants) };
}

export async function patchLiveTenantSubscription(tenantId: string, body: Record<string, unknown>) {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  return rabbitStationPatch<{ ok: boolean }>(
    `/api/admin/tenants/${encodeURIComponent(tenantId)}/subscription`,
    body,
  );
}

type MainSupportSession = {
  id: string;
  tenantId: string;
  tenantName: string;
  stationName?: string | null;
  adminEmail?: string | null;
  reason: string;
  accessMode: SupportAccessMode;
  status: SupportSession['status'];
  startedAt: string;
  expiresAt: string;
  endedAt?: string | null;
};

function mapSupportSession(row: MainSupportSession): SupportSession {
  return {
    id: row.id,
    tenantId: row.tenantId,
    tenantName: row.tenantName,
    stationName: row.stationName ?? null,
    adminEmail: row.adminEmail ?? null,
    reason: row.reason,
    accessMode: row.accessMode,
    status: row.status,
    startedAt: row.startedAt,
    expiresAt: row.expiresAt,
    endedAt: row.endedAt ?? null,
  };
}

export async function fetchLiveSupportSessions(filters?: { status?: string; tenantId?: string }) {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  const qs = new URLSearchParams();
  if (filters?.status) qs.set('status', filters.status);
  if (filters?.tenantId) qs.set('tenantId', filters.tenantId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await rabbitStationFetch<{ sessions: MainSupportSession[] }>(
    `/api/admin/support-sessions${suffix}`,
  );
  return { sessions: (data.sessions ?? []).map(mapSupportSession) };
}

export async function startLiveSupportSession(
  tenantId: string,
  body: { reason: string; accessMode: SupportAccessMode; durationMinutes: number },
): Promise<SupportSessionStartResult> {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  const raw = await rabbitStationPost<{
    ok?: boolean;
    supportSession: SupportSessionStartResult['supportSession'];
    impersonationUrl: string;
  }>(`/api/admin/tenants/${encodeURIComponent(tenantId)}/support-sessions/start`, body);
  if (!raw.impersonationUrl || !raw.supportSession?.id) {
    throw new RabbitStationApiError('Ungültige Antwort der Haupt-App (Support-Start).', 'invalid_json');
  }
  return {
    supportSession: raw.supportSession,
    impersonationUrl: raw.impersonationUrl,
  };
}

export async function endLiveSupportSession(sessionId: string) {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  await rabbitStationPost<{ ok: boolean }>(
    `/api/admin/support-sessions/${encodeURIComponent(sessionId)}/end`,
    {},
  );
  return { ok: true as const };
}

export async function fetchLiveLogs(limit = 50) {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  const [{ tenants }, data] = await Promise.all([
    fetchLiveTenants(),
    rabbitStationFetch<{ logs: Record<string, unknown>[] }>(`/api/admin/logs?limit=${limit}`),
  ]);
  return { logs: mapLogs((data.logs ?? []) as Parameters<typeof mapLogs>[0], tenants) };
}

export async function fetchLiveSecurity() {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  const data = await rabbitStationFetch<Record<string, unknown>>('/api/admin/security/summary');
  return { security: mapSecuritySummary(data) };
}

export async function fetchLiveBackups() {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  const data = await rabbitStationFetch<Record<string, unknown>>('/api/admin/backups/status');
  return { backups: mapBackupStatus(data) };
}

/** Lädt ausschließlich Live-Daten — kein Demo-Fallback. */
export async function fetchLiveOverview(): Promise<LoadResult> {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) {
    throw new RabbitStationApiError(cfg.error, 'config_missing');
  }

  const [healthBundle, tenantsRes, subsRaw, logsRaw, securityRes] = await Promise.all([
    fetchLiveHealthBundle(),
    fetchLiveTenants(),
    rabbitStationFetch<{
      byStatus?: { subscription_status: string; c: number }[];
      expiringTrials?: unknown[];
    }>('/api/admin/subscriptions/summary'),
    rabbitStationFetch<{ logs: Record<string, unknown>[] }>('/api/admin/logs?limit=80'),
    fetchLiveSecurity(),
  ]);
  const subsRes = {
    subscriptions: mapSubscriptionSummary(subsRaw, tenantsRes.tenants),
  };

  const logs = mapLogs(
    (logsRaw.logs ?? []) as Parameters<typeof mapLogs>[0],
    tenantsRes.tenants,
  );
  const tenants = applyTenantActivityFromLogs(tenantsRes.tenants, logs);
  const health = refineHealthComponents(healthBundle.health, healthBundle.backups, logs);

  const ccUptimeSec = process.uptime();
  const ccDays = Math.floor(ccUptimeSec / 86400);
  const ccHours = Math.floor((ccUptimeSec % 86400) / 3600);
  const systemInfo = {
    ...healthBundle.systemInfo,
    mainApp: {
      label: 'RabbitStation Haupt-App',
      environment: healthBundle.systemInfo.environment,
      version: healthBundle.systemInfo.version,
      databaseVersion: healthBundle.systemInfo.databaseVersion,
      nodeVersion: healthBundle.systemInfo.nodeVersion,
      region: healthBundle.systemInfo.region,
      lastDeploy: healthBundle.systemInfo.lastDeploy,
      uptime: healthBundle.systemInfo.uptime,
      serverTime: healthBundle.systemInfo.serverTime,
    },
    controlCenter: {
      label: 'RabbitStation Control Center',
      version: process.env.npm_package_version ?? '2.3.0',
      build: 'live',
      nodeVersion: process.version,
      region: 'Railway',
      uptime: ccDays > 0 ? `${ccDays} Tage, ${ccHours} Std.` : `${ccHours} Std.`,
      serverTime: new Date().toISOString(),
      apiConnected: true,
    },
  };

  return {
    meta: {
      source: 'live',
      apiConfigured: true,
      apiUrlSet: true,
      tokenSet: true,
    },
    data: {
      health,
      backups: healthBundle.backups,
      systemInfo,
      tenants,
      subscriptions: subsRes.subscriptions,
      logs,
      security: securityRes.security,
      charts: emptyCharts(),
    },
  };
}
