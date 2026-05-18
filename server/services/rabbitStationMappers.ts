import type {
  BackupStatus,
  ChartPoint,
  HealthResponse,
  HealthStatus,
  SecuritySummary,
  SubscriptionSummary,
  SystemInfo,
  SystemLog,
  Tenant,
} from '../types.js';

type MainHealth = {
  ok?: boolean;
  service?: string;
  product?: string;
  timestamp?: string;
  database?: string;
};

type MainTenant = {
  id: string;
  companyName?: string;
  slug?: string;
  plan?: string;
  subscriptionStatus?: string;
  trialEnd?: string | null;
  trialDaysLeft?: number | null;
  setupCompleted?: boolean;
  stationCount?: number;
  userCount?: number;
  contactEmail?: string;
  created_at?: string;
};

type MainLog = {
  id: string;
  tenant_id?: string | null;
  user_id?: string | null;
  action?: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata_json?: string | null;
  created_at?: string;
};

function hs(ok: boolean, warn = false): HealthStatus {
  if (!ok) return 'error';
  if (warn) return 'warning';
  return 'ok';
}

export function mapHealth(
  health: MainHealth,
  backups: { configured?: boolean; lastBackup?: string | null; message?: string },
  responseTimeMs: number,
  apiReachable: boolean,
): HealthResponse {
  const checkedAt = health.timestamp ?? new Date().toISOString();
  if (!apiReachable) {
    return {
      overallStatus: 'error',
      checkedAt,
      app: { status: 'error', message: 'Haupt-App nicht erreichbar' },
      api: { status: 'error', responseTimeMs: 0 },
      database: { status: 'error', connections: 0 },
      mail: { status: 'warning', deliveryRate: 0 },
      payments: { status: 'warning', openCases: 0 },
      backups: {
        status: 'error',
        lastBackupAt: checkedAt,
        nextBackupAt: checkedAt,
      },
      storage: { status: 'warning', usedPercent: 0, usedGb: 0, totalGb: 0 },
      uptime: { status: 'warning', percent30Days: 0 },
      warnings: [],
      errors: ['RabbitStation Haupt-App nicht erreichbar'],
    };
  }

  const appOk = health.ok !== false;
  const dbOk = Boolean(health.database);
  const backupOk = backups.configured === true;

  const parts: HealthStatus[] = [
    hs(appOk),
    hs(appOk),
    hs(dbOk),
    'warning',
    'warning',
    hs(backupOk, !backupOk),
    'warning',
    'warning',
  ];

  const overallStatus: HealthStatus = parts.includes('error')
    ? 'error'
    : parts.includes('warning')
      ? 'warning'
      : 'ok';

  return {
    overallStatus,
    checkedAt,
    app: {
      status: hs(appOk),
      message: health.product ?? health.service ?? 'RabbitStation Pro',
    },
    api: { status: hs(appOk), responseTimeMs },
    database: {
      status: hs(dbOk),
      connections: dbOk ? 1 : 0,
    },
    mail: { status: 'warning', deliveryRate: 0 },
    payments: { status: 'warning', openCases: 0 },
    backups: {
      status: hs(backupOk, !backupOk),
      lastBackupAt: backups.lastBackup ?? checkedAt,
      nextBackupAt: checkedAt,
    },
    storage: { status: 'warning', usedPercent: 0, usedGb: 0, totalGb: 0 },
    uptime: { status: 'warning', percent30Days: 0 },
    warnings: [
      'Mail: Unbekannt',
      'Zahlungen: Unbekannt',
      'Speicher: Unbekannt',
      'Uptime: Unbekannt',
    ],
    errors: appOk ? [] : ['Haupt-App meldet Fehlerstatus'],
  };
}

export function mapTenants(rows: MainTenant[]): Tenant[] {
  return rows.map((t) => ({
    id: t.id,
    name: t.companyName ?? t.slug ?? t.id,
    status: t.subscriptionStatus ?? 'unknown',
    plan: normalizePlan(t.plan),
    trial_end: t.trialEnd ?? null,
    employees: t.userCount ?? t.stationCount ?? 0,
    last_activity_minutes: 9999,
    locked: t.subscriptionStatus === 'blocked' ? 1 : 0,
  }));
}

function normalizePlan(plan?: string): string {
  const p = (plan ?? '').toLowerCase();
  if (p.includes('pro')) return 'pro';
  if (p.includes('basic')) return 'basic';
  return plan ?? 'pro';
}

export function mapSubscriptionSummary(data: {
  byStatus?: { subscription_status: string; c: number }[];
  expiringTrials?: unknown[];
}): SubscriptionSummary {
  const by = data.byStatus ?? [];
  const count = (status: string) =>
    by.find((r) => r.subscription_status === status)?.c ?? 0;
  const active = count('active');
  const trial = count('trial');
  const expired = count('expired') + count('cancelled');
  const pastDue = count('past_due');
  const total = by.reduce((s, r) => s + r.c, 0);

  return {
    activeTenants: total,
    activeTenantsTrend: `${total} Mandanten gesamt`,
    trials: trial,
    trialsTrend: `${(data.expiringTrials ?? []).length} laufen bald ab`,
    activeSubscriptions: active,
    activeSubscriptionsTrend: `${expired} abgelaufen`,
    monthlyRevenue: 0,
    monthlyRevenueCurrency: 'EUR',
    monthlyRevenueTrend:
      pastDue > 0 ? `${pastDue} mit offener Zahlung` : 'Noch keine Zahlungsdaten verfügbar',
  };
}

function severityForAction(action: string): string {
  if (action.includes('failed') || action.includes('blocked') || action.includes('denied')) {
    return 'error';
  }
  if (action.includes('expired') || action.includes('past_due') || action.includes('changed')) {
    return 'warning';
  }
  if (action.includes('created') || action.includes('success') || action.includes('active')) {
    return 'success';
  }
  return 'info';
}

export function mapLogs(rows: MainLog[]): SystemLog[] {
  return rows.map((r, i) => {
    const action = r.action ?? 'event';
    const tenant = r.tenant_id ? `Tenant ${r.tenant_id.slice(0, 8)}…` : 'Plattform';
    return {
      id: typeof r.id === 'number' ? r.id : i + 1,
      tenant_id: r.tenant_id ?? null,
      severity: severityForAction(action),
      category: r.entity_type ?? 'audit',
      action,
      message: `${action} – ${tenant}${r.user_id ? ` · User ${r.user_id.slice(0, 8)}…` : ''}`,
      created_at: r.created_at ?? new Date().toISOString(),
    };
  });
}

export function mapSecuritySummary(data: {
  failedLogins24h?: number;
  blockedTenants?: number;
}): SecuritySummary {
  return {
    failedLogins24h: data.failedLogins24h ?? 0,
    activeSupportSessions: 0,
    roleChanges24h: 0,
    blockedTenants: data.blockedTenants ?? 0,
    suspiciousApiRequests: 0,
    lockedUsers: data.blockedTenants ?? 0,
  };
}

export function mapBackupStatus(data: {
  configured?: boolean;
  lastBackup?: string | null;
  message?: string;
}): BackupStatus {
  const now = new Date().toISOString();
  if (!data.configured) {
    return {
      lastBackupAt: now,
      lastBackupStatus: 'not_configured',
      nextBackupAt: now,
      sizeBytes: 0,
      configured: false,
      message: data.message ?? 'Backup-System noch nicht konfiguriert',
    };
  }
  return {
    lastBackupAt: data.lastBackup ?? now,
    lastBackupStatus: data.lastBackup ? 'success' : 'unknown',
    nextBackupAt: now,
    sizeBytes: 0,
    configured: true,
    message: data.message,
  };
}

export function mapSystemInfo(health: MainHealth): SystemInfo {
  return {
    environment: 'Produktion',
    region: 'Railway',
    version: health.product ?? 'RabbitStation Pro',
    build: health.service ?? 'live',
    serverTime: health.timestamp ?? new Date().toISOString(),
    uptime: 'Unbekannt',
    systemLoadPercent: 0,
    nodeVersion: process.version,
    databaseVersion: health.database ?? 'Unbekannt',
    lastDeploy: health.timestamp ?? 'Unbekannt',
    commitHash: 'live-api',
  };
}

export function emptyCharts(): ChartPoint[] {
  return Array.from({ length: 12 }).map((_, i) => ({
    label: `${i}h`,
    responseTimeMs: 0,
    errorRate: 0,
    requests: 0,
  }));
}
