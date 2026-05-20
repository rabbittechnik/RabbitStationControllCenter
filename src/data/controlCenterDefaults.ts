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
import { normalizeHealthResponse } from '../utils/healthNormalize';
import { safeText } from '../utils/safeDisplay';

export const UNKNOWN_STATUS = 'unknown' as HealthStatus;

const unknownConnectivity = {
  status: UNKNOWN_STATUS,
  message: 'Nicht verfügbar',
  httpStatus: null as number | null,
};

export const defaultHealth: HealthResponse = {
  overallStatus: UNKNOWN_STATUS,
  checkedAt: new Date().toISOString(),
  frontend: { ...unknownConnectivity },
  serverApi: { ...unknownConnectivity },
  app: { status: UNKNOWN_STATUS, message: 'Nicht verfügbar' },
  api: { status: UNKNOWN_STATUS, responseTimeMs: 0 },
  database: { status: UNKNOWN_STATUS, connections: 0 },
  mail: { status: UNKNOWN_STATUS, deliveryRate: 0, configured: false },
  payments: { status: UNKNOWN_STATUS, openCases: 0, configured: false },
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
  activeTrials: 0,
  trialsExpiringToday: 0,
  expiredTrials: 0,
  trials: 0,
  trialsTrend: '–',
  activeSubscriptions: 0,
  activeSubscriptionsTrend: '–',
  starterCustomers: 0,
  proCustomers: 0,
  multiStationCustomers: 0,
  openPayments: 0,
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
  return normalizeHealthResponse(partial);
}

function mergeSystemInfo(partial?: Partial<SystemInfo> | null): SystemInfo {
  if (!partial || typeof partial !== 'object') return defaultSystemInfo;
  return {
    environment: safeText(partial.environment, defaultSystemInfo.environment),
    region: safeText(partial.region, defaultSystemInfo.region),
    version: safeText(partial.version, defaultSystemInfo.version),
    build: safeText(partial.build, defaultSystemInfo.build),
    serverTime: safeText(partial.serverTime, defaultSystemInfo.serverTime),
    uptime: safeText(partial.uptime, defaultSystemInfo.uptime),
    systemLoadPercent: typeof partial.systemLoadPercent === 'number' ? partial.systemLoadPercent : 0,
    nodeVersion: safeText(partial.nodeVersion, defaultSystemInfo.nodeVersion),
    databaseVersion: safeText(partial.databaseVersion, defaultSystemInfo.databaseVersion),
    lastDeploy: safeText(partial.lastDeploy, defaultSystemInfo.lastDeploy),
    commitHash: safeText(partial.commitHash, defaultSystemInfo.commitHash),
    mainApp: partial.mainApp,
    controlCenter: partial.controlCenter,
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
    systemInfo: mergeSystemInfo(raw.systemInfo),
    charts: Array.isArray(raw.charts) ? raw.charts : [],
  };
}
