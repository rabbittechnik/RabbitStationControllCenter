import type {
  BackupStatus,
  ControlCenterMeta,
  HealthResponse,
  HealthStatus,
  OverviewData,
  SecuritySummary,
  SubscriptionSummary,
} from '../types.js';
import type { RabbitStationConfig } from './rabbitStationApiClient.js';
import type { ConnectivitySnapshot } from './connectivityCheck.js';
import { isFrontendReachable, isServerApiReachable } from './connectivityCheck.js';
import { displayOrigin, getMainAppUrls, type MainAppUrls } from './mainAppUrls.js';
import { emptyCharts } from './rabbitStationMappers.js';
import { ensureHealthShape } from './healthNormalize.js';

export const NOT_CHECKABLE_MSG = 'Nicht prüfbar – Server/API offline';
export const API_OFFLINE_DATA_MSG =
  'Haupt-App API offline – Daten können aktuell nicht geladen werden.';
export const API_OFFLINE_LOGS_MSG =
  'Haupt-App-Logs können nicht geladen werden, weil die Server/API nicht erreichbar ist.';

function notCheckableStatus(): HealthStatus {
  return 'unknown';
}

export function notCheckableBackup(checkedAt: string): BackupStatus {
  return {
    lastBackupAt: '',
    lastBackupStatus: 'unknown',
    nextBackupAt: '',
    sizeBytes: 0,
    configured: false,
    message: NOT_CHECKABLE_MSG,
  };
}

export function emptySubscriptionSummary(): SubscriptionSummary {
  return {
    activeTenants: 0,
    activeTenantsTrend: '–',
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
    monthlyRevenueTrend: '–',
  };
}

export function emptySecurity(): SecuritySummary {
  return {
    failedLogins24h: 0,
    activeSupportSessions: 0,
    roleChanges24h: 0,
    blockedTenants: 0,
    suspiciousApiRequests: 0,
    lockedUsers: 0,
  };
}

/** Banner-Texte für Frontend/API-Kombinationen. */
export function computeConnectivityBanner(snapshot: ConnectivitySnapshot): string {
  const fe = isFrontendReachable(snapshot);
  const api = isServerApiReachable(snapshot);

  if (!snapshot.serverApi.url && snapshot.serverApi.message.includes('nicht konfiguriert')) {
    return 'API URL nicht konfiguriert. Bitte RABBITSTATION_API_URL setzen.';
  }
  if (!api && fe) {
    return 'Frontend ist online, aber Server/API ist offline. App kann für Nutzer teilweise sichtbar sein, aber Funktionen, Login, Daten und Zahlungen funktionieren nicht zuverlässig.';
  }
  if (api && !fe) {
    return 'API ist online, aber Frontend ist nicht erreichbar.';
  }
  if (!api && !fe) {
    return 'Haupt-App Server/API nicht erreichbar';
  }
  return '';
}

export function buildConnectivityMeta(
  snapshot: ConnectivitySnapshot,
  cfg: RabbitStationConfig,
  urls: MainAppUrls,
): ControlCenterMeta {
  const apiReachable = isServerApiReachable(snapshot);
  const feReachable = isFrontendReachable(snapshot);
  const banner = computeConnectivityBanner(snapshot);

  const base: ControlCenterMeta = {
    source: apiReachable ? 'live' : 'error',
    apiConfigured: cfg.ready,
    apiUrlSet: cfg.ready ? true : cfg.apiUrlSet,
    tokenSet: cfg.ready ? true : cfg.tokenSet,
    serverApiOnline: apiReachable,
    frontendOnline: feReachable,
    clientUrlDisplay: displayOrigin(urls.clientUrl),
    apiUrlDisplay: displayOrigin(urls.apiUrl),
    connectivityBanner: banner || undefined,
    message: banner || (apiReachable ? undefined : 'Haupt-App Server/API nicht erreichbar'),
    lastError: !apiReachable ? snapshot.serverApi.technicalDetail ?? snapshot.serverApi.message : undefined,
  };

  return base;
}

/** Health-Objekt nur aus Connectivity-Probes (API offline oder nur Basisdaten). */
export function buildHealthFromConnectivity(snapshot: ConnectivitySnapshot): HealthResponse {
  const checkedAt = snapshot.checkedAt;
  const apiOffline = !isServerApiReachable(snapshot);
  const nc = notCheckableStatus();

  const serverMsg = snapshot.serverApi.message;
  const feMsg = snapshot.frontend.message;

  const errors: string[] = [];
  if (apiOffline) {
    errors.push(snapshot.serverApi.railwayHint ?? serverMsg);
    if (snapshot.serverApi.technicalDetail) errors.push(snapshot.serverApi.technicalDetail);
  }

  const overallStatus: HealthStatus = apiOffline ? 'error' : feMsg.includes('nicht') ? 'warning' : 'ok';
  const overallLabel = apiOffline ? 'outage' : !isFrontendReachable(snapshot) ? 'partial' : 'operational';

  return ensureHealthShape({
    overallStatus,
    overallLabel,
    checkedAt,
    frontend: snapshot.frontend,
    serverApi: snapshot.serverApi,
    app: {
      status: snapshot.frontend.status,
      message: feMsg,
    },
    api: {
      status: snapshot.serverApi.status,
      responseTimeMs: snapshot.serverApi.responseTimeMs ?? 0,
    },
    database: { status: nc, connections: 0 },
    mail: {
      status: nc,
      deliveryRate: 0,
      message: NOT_CHECKABLE_MSG,
      configured: false,
    },
    payments: {
      status: nc,
      openCases: 0,
      message: NOT_CHECKABLE_MSG,
      configured: false,
    },
    backups: { status: nc, lastBackupAt: checkedAt, nextBackupAt: checkedAt },
    storage: { status: nc, usedPercent: 0, usedGb: 0, totalGb: 0 },
    uptime: { status: nc, percent30Days: 0 },
    warnings: apiOffline ? [NOT_CHECKABLE_MSG] : [],
    errors,
  });
}

/** Markiert abhängige Module als nicht prüfbar, wenn API offline. */
export function markDependentModulesNotCheckable(health: HealthResponse): HealthResponse {
  if (health.serverApi?.status === 'ok' || health.api?.status === 'ok') return health;
  const nc = notCheckableStatus();
  const checkedAt = health.checkedAt;
  return ensureHealthShape({
    ...health,
    overallStatus: 'error',
    overallLabel: 'outage',
    database: { status: nc, connections: 0 },
    mail: {
      status: nc,
      deliveryRate: 0,
      message: NOT_CHECKABLE_MSG,
      configured: false,
    },
    payments: {
      status: nc,
      openCases: 0,
      message: NOT_CHECKABLE_MSG,
      configured: false,
    },
    backups: { status: nc, lastBackupAt: checkedAt, nextBackupAt: checkedAt },
    storage: { status: nc, usedPercent: 0, usedGb: 0, totalGb: 0 },
    uptime: { status: nc, percent30Days: 0 },
  });
}

export function mergeConnectivityIntoHealth(
  health: HealthResponse,
  snapshot: ConnectivitySnapshot,
): HealthResponse {
  const merged = ensureHealthShape({
    ...health,
    frontend: snapshot.frontend,
    serverApi: snapshot.serverApi,
    app: {
      status: snapshot.frontend.status,
      message: snapshot.frontend.message,
    },
    api: {
      status: snapshot.serverApi.status,
      responseTimeMs: snapshot.serverApi.responseTimeMs ?? health.api?.responseTimeMs ?? 0,
    },
  });
  return markDependentModulesNotCheckable(merged);
}

export function buildPartialOverviewData(
  health: HealthResponse,
  snapshot: ConnectivitySnapshot,
  cfg: RabbitStationConfig,
): OverviewData {
  const urls = getMainAppUrls();
  const ccUptimeSec = process.uptime();
  const ccHours = Math.floor((ccUptimeSec % 86400) / 3600);

  return {
    health,
    backups: notCheckableBackup(snapshot.checkedAt),
    systemInfo: {
      environment: '–',
      region: 'Railway',
      version: '–',
      build: '–',
      serverTime: new Date().toISOString(),
      uptime: '–',
      systemLoadPercent: 0,
      nodeVersion: process.version,
      databaseVersion: NOT_CHECKABLE_MSG,
      lastDeploy: '–',
      commitHash: '–',
      mainApp: {
        label: 'RabbitStation Haupt-App',
        apiConnected: false,
        environment: '–',
        version: '–',
      },
      controlCenter: {
        label: 'RabbitStation Control Center',
        version: process.env.npm_package_version ?? '2.3.0',
        build: 'live',
        nodeVersion: process.version,
        region: 'Railway',
        uptime: `${ccHours} Std.`,
        serverTime: new Date().toISOString(),
        apiConnected: cfg.ready,
      },
      connectivity: {
        clientUrl: urls.clientUrl ?? undefined,
        apiUrl: urls.apiUrl ?? undefined,
        frontend: snapshot.frontend,
        serverApi: snapshot.serverApi,
      },
    },
    tenants: [],
    subscriptions: emptySubscriptionSummary(),
    logs: [],
    security: emptySecurity(),
    charts: emptyCharts(),
  };
}
