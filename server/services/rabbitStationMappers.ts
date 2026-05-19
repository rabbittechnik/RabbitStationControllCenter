import type {
  BackupStatus,
  ChartPoint,
  HealthResponse,
  SecuritySummary,
  SubscriptionSummary,
  SystemInfo,
  SystemLog,
  Tenant,
} from '../types.js';
import {
  mapSystemInfoFromHealth,
  normalizeAdminHealthPayload,
} from './healthNormalize.js';
import { enrichLogs } from './logFormat.js';

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
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  blockedReason?: string | null;
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

export function mapHealth(
  health: Record<string, unknown>,
  backups: { configured?: boolean; lastBackup?: string | null; message?: string },
  responseTimeMs: number,
  apiReachable: boolean,
): HealthResponse {
  return normalizeAdminHealthPayload(health, backups, responseTimeMs, apiReachable);
}

function resolveStatus(t: MainTenant): string {
  const blocked = t.blockedReason != null && String(t.blockedReason).trim() !== '';
  if (blocked || t.subscriptionStatus === 'blocked') return 'blocked';
  return t.subscriptionStatus ?? 'unknown';
}

export function normalizePlan(plan?: string): string {
  const p = (plan ?? '').toLowerCase().replace(/-/g, '_');
  if (p === 'starter' || p.includes('starter')) return 'starter';
  if (p === 'multi_station' || p.includes('multi')) return 'multi_station';
  if (p === 'pro' || p.includes('pro')) return 'pro';
  if (p.includes('basic')) return 'starter';
  return plan ?? 'starter';
}

export function mapTenants(rows: MainTenant[]): Tenant[] {
  return rows.map((t) => {
    const status = resolveStatus(t);
    return {
      id: t.id,
      name: t.companyName ?? t.slug ?? t.id,
      slug: t.slug,
      operator: t.contactEmail ?? undefined,
      status,
      plan: normalizePlan(t.plan),
      trial_end: t.trialEnd ?? null,
      trial_days_left: t.trialDaysLeft ?? null,
      employees: t.userCount ?? 0,
      station_count: t.stationCount ?? 0,
      last_activity_minutes: null,
      last_activity_at: null,
      locked: status === 'blocked' ? 1 : 0,
      current_period_start: t.currentPeriodStart ?? null,
      current_period_end: t.currentPeriodEnd ?? null,
      blocked_reason: t.blockedReason ?? null,
    };
  });
}

export function mapSubscriptionSummary(
  data: {
    byStatus?: { subscription_status: string; c: number }[];
    expiringTrials?: unknown[];
  },
  tenants: Tenant[] = [],
): SubscriptionSummary {
  const by = data.byStatus ?? [];
  const count = (status: string) =>
    by.find((r) => r.subscription_status === status)?.c ?? 0;
  const active = count('active');
  const trial = count('trial');
  const expired = count('expired');
  const pastDue = count('past_due');
  const total = by.reduce((s, r) => s + r.c, 0) || tenants.length;

  const today = new Date().toISOString().slice(0, 10);
  const trialsExpiringToday = tenants.filter(
    (t) => t.status === 'trial' && t.trial_end?.slice(0, 10) === today,
  ).length;
  const expiredTrials = tenants.filter(
    (t) =>
      t.status === 'expired' ||
      (t.status === 'trial' && t.trial_days_left != null && t.trial_days_left <= 0),
  ).length;

  const starterCustomers = tenants.filter((t) => t.plan === 'starter').length;
  const proCustomers = tenants.filter((t) => t.plan === 'pro').length;
  const multiStationCustomers = tenants.filter((t) => t.plan === 'multi_station').length;

  return {
    activeTenants: total,
    activeTenantsTrend: `${active} aktiv · ${trial} in Testphase`,
    activeTrials: trial,
    trialsExpiringToday,
    expiredTrials: expiredTrials || expired,
    trials: trial,
    trialsTrend: `${(data.expiringTrials ?? []).length} laufen in ≤3 Tagen ab`,
    activeSubscriptions: active,
    activeSubscriptionsTrend: `${expired} abgelaufen · ${pastDue} Zahlung offen`,
    starterCustomers,
    proCustomers,
    multiStationCustomers,
    openPayments: pastDue,
    monthlyRevenue: 0,
    monthlyRevenueCurrency: 'EUR',
    monthlyRevenueTrend: 'Noch keine Zahlungsdaten verfügbar',
  };
}

export function mapLogs(rows: MainLog[], tenants: Tenant[] = []): SystemLog[] {
  return enrichLogs(rows, tenants);
}

export function mapSecuritySummary(data: {
  failedLogins24h?: number;
  blockedTenants?: number;
  activeSupportSessions?: number;
}): SecuritySummary {
  return {
    failedLogins24h: data.failedLogins24h ?? 0,
    activeSupportSessions: data.activeSupportSessions ?? 0,
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

export function mapSystemInfo(health: Record<string, unknown>): SystemInfo {
  return mapSystemInfoFromHealth(health);
}

export function emptyCharts(): ChartPoint[] {
  return Array.from({ length: 12 }).map((_, i) => ({
    label: `${i}h`,
    responseTimeMs: 0,
    errorRate: 0,
    requests: 0,
  }));
}
