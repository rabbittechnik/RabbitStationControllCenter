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
  normalizeHealthResponse,
} from './healthNormalize.js';
import { enrichLogs } from './logFormat.js';

type MainTenant = {
  id: string;
  companyName?: string;
  slug?: string;
  stationName?: string | null;
  ownerEmail?: string | null;
  plan?: string;
  subscriptionStatus?: string;
  trialEnd?: string | null;
  trialDaysLeft?: number | null;
  remainingDays?: number | null;
  trialExtendedCount?: number;
  setupCompleted?: boolean;
  stationCount?: number;
  userCount?: number;
  employeeCount?: number;
  contactEmail?: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  blockedReason?: string | null;
  paymentProvider?: string | null;
  paymentStatus?: string | null;
  requestedPlan?: string | null;
  paymentStartedAt?: string | null;
  paymentConfirmedAt?: string | null;
  paymentReference?: string | null;
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
  health: Record<string, unknown> | unknown,
  backups: {
    configured?: boolean;
    lastBackup?: string | null;
    message?: string;
    lastBackupStatus?: string;
  },
  responseTimeMs: number,
  apiReachable: boolean,
): HealthResponse {
  return normalizeHealthResponse(health, backups, responseTimeMs, apiReachable);
}

function resolveStatus(t: MainTenant): string {
  const blocked = t.blockedReason != null && String(t.blockedReason).trim() !== '';
  if (blocked || t.subscriptionStatus === 'blocked') return 'blocked';
  const status = t.subscriptionStatus ?? 'unknown';
  if (status === 'pending_payment') return 'pending_payment';
  if (status === 'trial') {
    const days = t.remainingDays ?? t.trialDaysLeft;
    if (days != null && days <= 0) return 'expired';
  }
  return status;
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
      station_name: t.stationName ?? null,
      operator: t.ownerEmail ?? t.contactEmail ?? undefined,
      status,
      plan: normalizePlan(t.plan),
      trial_end: t.trialEnd ?? null,
      trial_days_left: t.remainingDays ?? t.trialDaysLeft ?? null,
      trial_extended_count: t.trialExtendedCount ?? 0,
      employees: t.employeeCount ?? t.userCount ?? 0,
      station_count: t.stationCount ?? 0,
      last_activity_minutes: null,
      last_activity_at: null,
      locked: status === 'blocked' ? 1 : 0,
      current_period_start: t.currentPeriodStart ?? null,
      current_period_end: t.currentPeriodEnd ?? null,
      blocked_reason: t.blockedReason ?? null,
      subscription_status: t.subscriptionStatus ?? status,
      payment_provider: t.paymentProvider ?? null,
      payment_status: t.paymentStatus ?? 'none',
      requested_plan: t.requestedPlan ?? null,
      payment_started_at: t.paymentStartedAt ?? null,
      payment_confirmed_at: t.paymentConfirmedAt ?? null,
      payment_reference: t.paymentReference ?? null,
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
  const pendingPayment = count('pending_payment');
  const total = by.reduce((s, r) => s + r.c, 0) || tenants.length;

  const pendingFromTenants = tenants.filter(
    (t) => t.payment_status === 'pending' || t.status === 'pending_payment',
  ).length;
  const sumupPending = tenants.filter(
    (t) =>
      t.payment_status === 'pending' &&
      (t.payment_provider ?? '').toLowerCase() === 'sumup',
  ).length;
  const planRevenue: Record<string, number> = { starter: 19.9, pro: 39.9, multi_station: 69.9 };
  const estimatedRevenue = tenants
    .filter((t) => t.status === 'active')
    .reduce((s, t) => s + (planRevenue[t.plan] ?? 0), 0);

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
    openPayments: pastDue + pendingFromTenants,
    pendingPayments: pendingFromTenants || pendingPayment,
    sumupPaymentsStarted: sumupPending,
    manualReviewCount: pendingFromTenants || pendingPayment,
    monthlyRevenue: Math.round(estimatedRevenue * 100) / 100,
    monthlyRevenueCurrency: 'EUR',
    monthlyRevenueTrend:
      estimatedRevenue > 0 ?
        `Geschätzt aus ${active} aktiven Abos`
      : 'Noch keine aktiven Abos',
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

export function mapBackupStatus(
  data: {
    configured?: boolean;
    lastBackup?: string | null;
    message?: string;
    status?: string;
  } | null | undefined,
): BackupStatus {
  const d = data ?? {};
  const now = new Date().toISOString();
  const message = d.message ?? '';
  const status = typeof d.status === 'string' ? d.status : undefined;
  const notConfigured =
    d.configured === false ||
    status === 'not_configured' ||
    (message.toLowerCase().includes('not configured') && message.toLowerCase().includes('backup'));

  if (notConfigured) {
    return {
      lastBackupAt: now,
      lastBackupStatus: 'not_configured',
      nextBackupAt: now,
      sizeBytes: 0,
      configured: false,
      message: message || 'Backup-System noch nicht konfiguriert',
    };
  }

  const configured = d.configured === true || status === 'ok' || Boolean(d.lastBackup);
  return {
    lastBackupAt: d.lastBackup ?? now,
    lastBackupStatus: d.lastBackup ? 'success' : status === 'ok' ? 'success' : 'unknown',
    nextBackupAt: now,
    sizeBytes: 0,
    configured,
    message: message || undefined,
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
