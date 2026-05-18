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
import { getDb } from '../db/index.js';
import { runHealthCheck, getDemoHealthChart } from './health.js';
import { APP_BUILD, APP_REGION, APP_VERSION } from '../constants.js';
import os from 'os';

export type LoadResult = {
  data: OverviewData;
  meta: ControlCenterMeta;
};

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

export async function fetchLiveOverview(): Promise<LoadResult> {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) {
    return loadDemoOverview(cfg.error);
  }

  try {
    const [healthBundle, tenantsRes, subsRes, logsRes, securityRes] = await Promise.all([
      fetchLiveHealthBundle(),
      fetchLiveTenants(),
      fetchLiveSubscriptions(),
      fetchLiveLogs(30),
      fetchLiveSecurity(),
    ]);

    return {
      meta: { source: 'live', apiConfigured: true },
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
    const demo = await loadDemoOverview(msg);
    return {
      ...demo,
      meta: {
        source: 'demo',
        apiConfigured: true,
        message: 'Demo-Modus – Haupt-App nicht erreichbar oder Token ungültig',
        lastError: msg,
      },
    };
  }
}

export async function loadDemoOverview(reason?: string): Promise<LoadResult> {
  const health = await runHealthCheck();
  const db = getDb();
  const logs = db
    .prepare(
      `SELECT id, tenant_id, severity, category, action, message, created_at
       FROM system_logs ORDER BY created_at DESC LIMIT 10`,
    )
    .all() as OverviewData['logs'];
  const tenants = db.prepare(`SELECT * FROM demo_tenants ORDER BY last_activity_minutes ASC`).all() as OverviewData['tenants'];

  const cfg = getRabbitStationConfig();

  return {
    meta: {
      source: 'demo',
      apiConfigured: cfg.ready,
      message: reason ? `Demo-Modus: ${reason}` : 'Demo-Modus',
    },
    data: {
      health,
      logs,
      tenants,
      subscriptions: {
        activeTenants: 24,
        activeTenantsTrend: '+2 seit letztem Monat',
        trials: 6,
        trialsTrend: '-1 seit letztem Monat',
        activeSubscriptions: 21,
        activeSubscriptionsTrend: '+3 seit letztem Monat',
        monthlyRevenue: 0,
        monthlyRevenueCurrency: 'EUR',
        monthlyRevenueTrend: 'Noch keine Zahlungsdaten verfügbar',
      },
      security: {
        failedLogins24h: 7,
        activeSupportSessions: 0,
        roleChanges24h: 2,
      },
      backups: getDemoBackupStatus(db),
      systemInfo: getDemoSystemInfo(),
      charts: getDemoHealthChart('24h'),
    },
  };
}

function getDemoBackupStatus(db: ReturnType<typeof getDb>) {
  const last = db
    .prepare(`SELECT * FROM backup_logs ORDER BY finished_at DESC LIMIT 1`)
    .get() as { status: string; finished_at: string; size_bytes: number } | undefined;
  const now = new Date();
  const next = new Date(now);
  next.setHours(22, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return {
    lastBackupAt: last?.finished_at ?? new Date().toISOString(),
    lastBackupStatus: last?.status ?? 'success',
    nextBackupAt: next.toISOString(),
    sizeBytes: last?.size_bytes ?? 0,
    configured: true,
  };
}

function getDemoSystemInfo() {
  const uptimeSec = os.uptime();
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  return {
    environment: 'Demo',
    region: `${APP_REGION} (Frankfurt)`,
    version: APP_VERSION,
    build: APP_BUILD,
    serverTime: new Date().toISOString(),
    uptime: `${days} Tage, ${hours} Std.`,
    systemLoadPercent: 0,
    nodeVersion: process.version,
    databaseVersion: 'SQLite (Demo)',
    lastDeploy: 'Demo',
    commitHash: 'demo',
  };
}
