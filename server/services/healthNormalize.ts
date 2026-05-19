import type { HealthResponse, HealthStatus } from '../types.js';

type HealthComponent = {
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

export function parseHealthStatus(value: unknown): HealthStatus {
  if (value === 'ok' || value === 'warning' || value === 'error' || value === 'unknown') return value;
  return 'warning';
}

export function pickHealthComponent(raw: unknown): HealthComponent | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as HealthComponent;
}

export function componentStatus(raw: unknown, fallback: HealthStatus = 'warning'): HealthStatus {
  return parseHealthStatus(pickHealthComponent(raw)?.status ?? fallback);
}

export function databaseVersionLabel(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  const c = pickHealthComponent(raw);
  if (!c) return 'Nicht verfügbar';
  const parts: string[] = [];
  if (c.status) parts.push(String(c.status).toUpperCase());
  if (c.connections != null) parts.push(`${c.connections} Verbindungen`);
  if (c.message) parts.push(c.message);
  return parts.length > 0 ? parts.join(' · ') : 'Nicht verfügbar';
}

export function uptimeLabel(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  const c = pickHealthComponent(raw);
  if (c?.percent30Days != null && c.percent30Days > 0) {
    return `${c.percent30Days} % (letzte 30 Tage)`;
  }
  return 'Nicht verfügbar';
}

function mergeComponentWarnings(health: Record<string, unknown>): string[] {
  const warnings: string[] = [];
  const mail = pickHealthComponent(health.mail);
  const payments = pickHealthComponent(health.payments);
  const storage = pickHealthComponent(health.storage);
  const uptime = health.uptime;

  if (mail?.message) warnings.push(`Mail: ${mail.message}`);
  else if (componentStatus(health.mail) === 'warning') warnings.push('Mail: Unbekannt');

  if (payments?.message) warnings.push(`Zahlungen: ${payments.message}`);
  else if (componentStatus(health.payments) === 'warning') warnings.push('Zahlungen: Unbekannt');

  if (storage?.message) warnings.push(`Speicher: ${storage.message}`);
  else if (componentStatus(health.storage) === 'warning') warnings.push('Speicher: Unbekannt');

  if (typeof uptime === 'string') warnings.push(`Uptime: ${uptime}`);
  else if (componentStatus(health.uptime) === 'warning') warnings.push('Uptime: Unbekannt');

  return warnings;
}

/** Normalisiert die Haupt-App Admin-Health-API in das Control-Center-Format. */
export function normalizeAdminHealthPayload(
  health: Record<string, unknown>,
  backups: { configured?: boolean; lastBackup?: string | null; message?: string },
  responseTimeMs: number,
  apiReachable: boolean,
): HealthResponse {
  const checkedAt =
    typeof health.checkedAt === 'string' ? health.checkedAt : new Date().toISOString();

  if (!apiReachable) {
    return {
      overallStatus: 'error',
      checkedAt,
      app: { status: 'error', message: 'Haupt-App nicht erreichbar' },
      api: { status: 'error', responseTimeMs: 0 },
      database: { status: 'error', connections: 0 },
      mail: { status: 'unknown', deliveryRate: 0, message: 'Nicht verfügbar' },
      payments: { status: 'unknown', openCases: 0, message: 'Nicht verfügbar' },
      backups: { status: 'error', lastBackupAt: checkedAt, nextBackupAt: checkedAt },
      storage: { status: 'warning', usedPercent: 0, usedGb: 0, totalGb: 0 },
      uptime: { status: 'warning', percent30Days: 0 },
      warnings: [],
      errors: ['RabbitStation Haupt-App nicht erreichbar'],
    };
  }

  const app = pickHealthComponent(health.app);
  const api = pickHealthComponent(health.api);
  const database = pickHealthComponent(health.database);
  const mail = pickHealthComponent(health.mail);
  const payments = pickHealthComponent(health.payments);
  const storage = pickHealthComponent(health.storage);
  const backupsHealth = pickHealthComponent(health.backups);
  const uptimeRaw = health.uptime;

  const backupOk = backups.configured === true;
  const backupStatus: HealthStatus =
    backups.configured === false ? 'unknown'
    : backupsHealth?.status ?
      parseHealthStatus(backupsHealth.status)
    : backupOk ? 'ok'
    : 'warning';

  const uptimeLabel = typeof uptimeRaw === 'string' ? uptimeRaw : undefined;

  const uptimePercent =
    typeof uptimeRaw === 'object' && uptimeRaw && !Array.isArray(uptimeRaw) ?
      Number((uptimeRaw as HealthComponent).percent30Days ?? 0)
    : 0;

  const uptimeStatus: HealthStatus =
    typeof uptimeRaw === 'string' ? 'ok' : parseHealthStatus(pickHealthComponent(uptimeRaw)?.status ?? 'warning');

  const parts: HealthStatus[] = [
    parseHealthStatus(app?.status ?? (health.ok === false ? 'error' : 'ok')),
    parseHealthStatus(api?.status ?? 'ok'),
    parseHealthStatus(database?.status ?? 'ok'),
    parseHealthStatus(mail?.status ?? 'warning'),
    parseHealthStatus(payments?.status ?? 'warning'),
    backupStatus,
    parseHealthStatus(storage?.status ?? 'warning'),
    uptimeStatus,
  ];

  const overallStatus: HealthStatus =
    typeof health.overallStatus === 'string' ?
      parseHealthStatus(health.overallStatus)
    : parts.includes('error') ? 'error'
    : parts.includes('warning') ? 'warning'
    : 'ok';

  const errors: string[] = [];
  if (health.ok === false) errors.push('Haupt-App meldet Fehlerstatus');
  if (database?.status === 'error' && database.message) {
    errors.push(database.message);
  }

  return {
    overallStatus,
    checkedAt,
    app: {
      status: parseHealthStatus(app?.status ?? (health.ok === false ? 'error' : 'ok')),
      message:
        app?.message ??
        (typeof health.product === 'string' ? health.product : undefined) ??
        (typeof health.service === 'string' ? health.service : undefined) ??
        'RabbitStation Pro',
    },
    api: {
      status: parseHealthStatus(api?.status ?? 'ok'),
      responseTimeMs: api?.responseTimeMs ?? responseTimeMs,
    },
    database: {
      status: parseHealthStatus(database?.status ?? 'ok'),
      connections: database?.connections ?? 0,
    },
    mail: {
      status: parseHealthStatus(mail?.status ?? 'warning'),
      deliveryRate: mail?.deliveryRate ?? 0,
      message: mail?.message,
    },
    payments: {
      status: parseHealthStatus(payments?.status ?? 'warning'),
      openCases: payments?.openCases ?? 0,
      message: payments?.message,
    },
    backups: {
      status: backupStatus,
      lastBackupAt:
        backupsHealth?.lastBackupAt ?? backups.lastBackup ?? checkedAt,
      nextBackupAt: backupsHealth?.nextBackupAt ?? checkedAt,
    },
    storage: {
      status: parseHealthStatus(storage?.status ?? 'warning'),
      usedPercent: storage?.usedPercent ?? 0,
      usedGb: storage?.usedGb ?? 0,
      totalGb: storage?.totalGb ?? 0,
    },
    uptime: {
      status: uptimeStatus,
      percent30Days: uptimePercent,
    },
    uptimeLabel,
    warnings: mergeComponentWarnings(health),
    errors,
  };
}

export function mapSystemInfoFromHealth(health: Record<string, unknown>): {
  environment: string;
  region: string;
  version: string;
  build: string;
  serverTime: string;
  uptime: string;
  systemLoadPercent: number;
  nodeVersion: string;
  databaseVersion: string;
  lastDeploy: string;
  commitHash: string;
} {
  const checkedAt =
    typeof health.checkedAt === 'string' ? health.checkedAt : new Date().toISOString();

  return {
    environment: typeof health.environment === 'string' ? health.environment : 'Produktion',
    region: 'Railway',
    version:
      typeof health.version === 'string' ? health.version
      : typeof health.product === 'string' ? health.product
      : 'RabbitStation Pro',
    build: typeof health.service === 'string' ? health.service : 'live',
    serverTime: checkedAt,
    uptime: uptimeLabel(health.uptime),
    systemLoadPercent: 0,
    nodeVersion: process.version,
    databaseVersion: databaseVersionLabel(health.database),
    lastDeploy: checkedAt,
    commitHash: 'live-api',
  };
}
