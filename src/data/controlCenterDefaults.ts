import type {
  BackupStatus,
  ChartPoint,
  HealthResponse,
  HealthStatus,
  OverviewData,
  SecuritySummary,
  SubscriptionSummary,
  SystemInfo,
  SystemLog,
  Tenant,
} from '../types';

export const UNKNOWN_STATUS = 'unknown' as HealthStatus;

export const defaultHealth: HealthResponse = {
  overallStatus: UNKNOWN_STATUS,
  checkedAt: new Date().toISOString(),
  app: { status: UNKNOWN_STATUS, message: 'Nicht verfügbar' },
  api: { status: UNKNOWN_STATUS, responseTimeMs: 0 },
  database: { status: UNKNOWN_STATUS, connections: 0 },
  mail: { status: UNKNOWN_STATUS, deliveryRate: 0 },
  payments: { status: UNKNOWN_STATUS, openCases: 0 },
  backups: {
    status: UNKNOWN_STATUS,
    lastBackupAt: '',
    nextBackupAt: '',
  },
  storage: {
    status: UNKNOWN_STATUS,
    usedPercent: 0,
    usedGb: 0,
    totalGb: 0,
  },
  uptime: { status: UNKNOWN_STATUS, percent30Days: 0 },
  warnings: [],
  errors: [],
};

export const defaultTenants: Tenant[] = [];

export const defaultLogs: SystemLog[] = [];

export const defaultSubscriptions: SubscriptionSummary = {
  activeTenants: 0,
  activeTenantsTrend: 'Noch keine Abo-Daten verfügbar',
  trials: 0,
  trialsTrend: '–',
  activeSubscriptions: 0,
  activeSubscriptionsTrend: '–',
  monthlyRevenue: 0,
  monthlyRevenueCurrency: 'EUR',
  monthlyRevenueTrend: 'Noch keine Zahlungsdaten verfügbar',
};

export const defaultSecurity: SecuritySummary = {
  failedLogins24h: 0,
  activeSupportSessions: 0,
  roleChanges24h: 0,
  blockedTenants: 0,
  suspiciousApiRequests: 0,
  lockedUsers: 0,
};

export const defaultBackups: BackupStatus = {
  lastBackupAt: '',
  lastBackupStatus: 'unknown',
  nextBackupAt: '',
  sizeBytes: 0,
  configured: false,
  message: 'Backup-System nicht konfiguriert',
};

export const defaultSystemInfo: SystemInfo = {
  environment: '–',
  region: '–',
  version: '–',
  build: '–',
  serverTime: new Date().toISOString(),
  uptime: '–',
  systemLoadPercent: 0,
  nodeVersion: '–',
  databaseVersion: '–',
  lastDeploy: '',
  commitHash: '–',
};

export const defaultCharts: ChartPoint[] = [];

export const defaultOverviewData: OverviewData = {
  health: defaultHealth,
  logs: defaultLogs,
  tenants: defaultTenants,
  subscriptions: defaultSubscriptions,
  security: defaultSecurity,
  backups: defaultBackups,
  systemInfo: defaultSystemInfo,
  charts: defaultCharts,
};

function mergeHealth(partial?: Partial<HealthResponse> | null): HealthResponse {
  if (!partial || typeof partial !== 'object') return defaultHealth;
  return {
    ...defaultHealth,
    ...partial,
    app: { ...defaultHealth.app, ...partial.app },
    api: { ...defaultHealth.api, ...partial.api },
    database: { ...defaultHealth.database, ...partial.database },
    mail: { ...defaultHealth.mail, ...partial.mail },
    payments: { ...defaultHealth.payments, ...partial.payments },
    backups: { ...defaultHealth.backups, ...partial.backups },
    storage: { ...defaultHealth.storage, ...partial.storage },
    uptime: { ...defaultHealth.uptime, ...partial.uptime },
    warnings: Array.isArray(partial.warnings) ? partial.warnings : [],
    errors: Array.isArray(partial.errors) ? partial.errors : [],
  };
}

/** Normalisiert API-Antworten — verhindert Crashes bei fehlenden Feldern. */
export function normalizeOverviewData(raw: Partial<OverviewData> | null | undefined): OverviewData {
  if (!raw || typeof raw !== 'object') return { ...defaultOverviewData };

  return {
    health: mergeHealth(raw.health),
    logs: Array.isArray(raw.logs) ? raw.logs : [],
    tenants: Array.isArray(raw.tenants) ? raw.tenants : [],
    subscriptions: { ...defaultSubscriptions, ...(raw.subscriptions ?? {}) },
    security: { ...defaultSecurity, ...(raw.security ?? {}) },
    backups: { ...defaultBackups, ...(raw.backups ?? {}) },
    systemInfo: { ...defaultSystemInfo, ...(raw.systemInfo ?? {}) },
    charts: Array.isArray(raw.charts) ? raw.charts : [],
  };
}
