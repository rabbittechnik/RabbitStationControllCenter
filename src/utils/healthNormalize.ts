import type { HealthResponse, HealthStatus } from '../types';
import { safeNumber, safeText } from './safeDisplay';

type Component = {
  status?: string;
  message?: string;
  connections?: number;
  responseTimeMs?: number;
  deliveryRate?: number;
  openCases?: number;
  usedPercent?: number;
  usedGb?: number;
  totalGb?: number;
  percent30Days?: number;
  lastBackupAt?: string;
  nextBackupAt?: string;
};

function parseStatus(value: unknown, fallback: HealthStatus = 'unknown'): HealthStatus {
  if (value === 'ok' || value === 'warning' || value === 'error') return value;
  return fallback;
}

function pickComponent(raw: unknown): Component | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as Component;
}

function mergeComponent<T extends Record<string, unknown>>(
  defaults: T,
  partial: unknown,
  map: (c: Component | null, raw: unknown) => T,
): T {
  return map(pickComponent(partial), partial);
}

/** Client-seitige Absicherung — auch wenn die API noch Objekte in String-Feldern liefert. */
export function normalizeHealthResponse(partial?: Partial<HealthResponse> | null): HealthResponse {
  const checkedAt =
    typeof partial?.checkedAt === 'string' ? partial.checkedAt : new Date().toISOString();

  const app = mergeComponent(
    { status: 'unknown' as HealthStatus, message: 'Nicht verfügbar' },
    partial?.app,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      message: safeText(c?.message, 'Nicht verfügbar'),
    }),
  );

  const api = mergeComponent(
    { status: 'unknown' as HealthStatus, responseTimeMs: 0 },
    partial?.api,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      responseTimeMs: safeNumber(c?.responseTimeMs, 0),
    }),
  );

  const database = mergeComponent(
    { status: 'unknown' as HealthStatus, connections: 0 },
    partial?.database,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      connections: safeNumber(c?.connections, 0),
    }),
  );

  const mail = mergeComponent(
    { status: 'unknown' as HealthStatus, deliveryRate: 0, message: undefined, configured: undefined },
    partial?.mail,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      deliveryRate: safeNumber(c?.deliveryRate, 0),
      message: typeof c?.message === 'string' ? c.message : partial?.mail?.message,
      configured: partial?.mail?.configured,
    }),
  );

  const payments = mergeComponent(
    { status: 'unknown' as HealthStatus, openCases: 0, message: undefined, configured: undefined },
    partial?.payments,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      openCases: safeNumber(c?.openCases, 0),
      message: typeof c?.message === 'string' ? c.message : partial?.payments?.message,
      configured: partial?.payments?.configured,
    }),
  );

  const backups = mergeComponent(
    {
      status: 'unknown' as HealthStatus,
      lastBackupAt: checkedAt,
      nextBackupAt: checkedAt,
    },
    partial?.backups,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      lastBackupAt: safeText(c?.lastBackupAt, checkedAt),
      nextBackupAt: safeText(c?.nextBackupAt, checkedAt),
    }),
  );

  const storage = mergeComponent(
    { status: 'unknown' as HealthStatus, usedPercent: 0, usedGb: 0, totalGb: 0 },
    partial?.storage,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      usedPercent: safeNumber(c?.usedPercent, 0),
      usedGb: safeNumber(c?.usedGb, 0),
      totalGb: safeNumber(c?.totalGb, 0),
    }),
  );

  let uptime: HealthResponse['uptime'];
  if (typeof partial?.uptime === 'string') {
    uptime = { status: 'ok', percent30Days: 0 };
  } else {
    uptime = mergeComponent(
      { status: 'unknown' as HealthStatus, percent30Days: 0 },
      partial?.uptime,
      (c) => ({
        status: parseStatus(c?.status, 'unknown'),
        percent30Days: safeNumber(c?.percent30Days, 0),
      }),
    );
  }

  return {
    overallStatus: parseStatus(partial?.overallStatus, 'unknown'),
    overallLabel: partial?.overallLabel,
    checkedAt,
    uptimeLabel: typeof partial?.uptimeLabel === 'string' ? partial.uptimeLabel : undefined,
    app,
    api,
    database,
    mail,
    payments,
    backups,
    storage,
    uptime,
    warnings: Array.isArray(partial?.warnings) ? partial.warnings.map((w) => safeText(w)) : [],
    errors: Array.isArray(partial?.errors) ? partial.errors.map((e) => safeText(e)) : [],
  };
}

export function uptimeDisplaySubtitle(partial?: Partial<HealthResponse> | null): string {
  if (partial?.uptimeLabel) return 'Haupt-App Laufzeit (OS)';
  const c = pickComponent(partial?.uptime);
  if (c?.percent30Days != null && c.percent30Days > 0) return 'Letzte 30 Tage';
  return 'Nicht verfügbar';
}

export function uptimeDisplayValue(partial?: Partial<HealthResponse> | null): string {
  if (partial?.uptimeLabel) return partial.uptimeLabel;
  const c = pickComponent(partial?.uptime);
  if (c?.percent30Days != null && c.percent30Days > 0) return `${c.percent30Days} %`;
  return 'Nicht verfügbar';
}
