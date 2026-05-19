import { getRabbitStationConfig, rabbitStationFetch, RabbitStationApiError } from './rabbitStationApiClient.js';
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
  return { subscriptions: mapSubscriptionSummary(data) };
}

export async function fetchLiveLogs(limit = 50) {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) throw new RabbitStationApiError(cfg.error, 'config_missing');
  const data = await rabbitStationFetch<{ logs: Record<string, unknown>[] }>(
    `/api/admin/logs?limit=${limit}`,
  );
  return { logs: mapLogs((data.logs ?? []) as Parameters<typeof mapLogs>[0]) };
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

  const [healthBundle, tenantsRes, subsRes, logsRes, securityRes] = await Promise.all([
    fetchLiveHealthBundle(),
    fetchLiveTenants(),
    fetchLiveSubscriptions(),
    fetchLiveLogs(30),
    fetchLiveSecurity(),
  ]);

  return {
    meta: {
      source: 'live',
      apiConfigured: true,
      apiUrlSet: true,
      tokenSet: true,
    },
    data: {
      health: healthBundle.health,
      backups: healthBundle.backups,
      systemInfo: healthBundle.systemInfo,
      tenants: tenantsRes.tenants,
      subscriptions: subsRes.subscriptions,
      logs: logsRes.logs,
      security: securityRes.security,
      charts: emptyCharts(),
    },
  };
}
