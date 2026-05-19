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

export type ComponentDisplay = {
  status: HealthStatus;
  configured: boolean;
  displayValue: string;
  displaySubtitle: string;
};

export function parseHealthStatus(value: unknown): HealthStatus {
  if (value === 'ok' || value === 'warning' || value === 'error' || value === 'unknown') return value;
  if (value === 'not_configured') return 'unknown';
  return 'warning';
}

export function pickHealthComponent(raw: unknown): HealthComponent | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as HealthComponent;
}

export function componentStatus(raw: unknown, fallback: HealthStatus = 'warning'): HealthStatus {
  return parseHealthStatus(pickHealthComponent(raw)?.status ?? fallback);
}

/** Liest Health aus { ok, data } oder direkt aus dem Payload. */
export function unwrapHealthPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const obj = payload as Record<string, unknown>;
  if (
    obj.ok === true &&
    obj.data != null &&
    typeof obj.data === 'object' &&
    !Array.isArray(obj.data)
  ) {
    return obj.data as Record<string, unknown>;
  }
  return obj;
}

export function isNotConfiguredMessage(msg?: string): boolean {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return (
    m.includes('not configured') ||
    m.includes('nicht konfiguriert') ||
    m.includes('noch nicht angebunden') ||
    m.includes('noch nicht eingerichtet') ||
    m.includes('not set up')
  );
}

export function isPaymentProviderNotConfigured(status?: string, message?: string): boolean {
  if (status === 'not_configured') return true;
  const m = (message ?? '').toLowerCase();
  if (m.includes('payment provider not configured')) return true;
  if (m.includes('zahlung') && m.includes('not configured')) return true;
  if (status === 'warning' && m.includes('not configured') && m.includes('payment')) return true;
  return false;
}

export function isBackupSystemNotConfigured(status?: string, message?: string): boolean {
  if (status === 'not_configured') return true;
  const m = (message ?? '').toLowerCase();
  if (m.includes('backup system not configured')) return true;
  if (m.includes('backup') && m.includes('not configured')) return true;
  if (status === 'warning' && m.includes('not configured') && m.includes('backup')) return true;
  return false;
}

export function isRealPaymentIssue(message?: string, openCases?: number): boolean {
  if ((openCases ?? 0) > 0) return true;
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('past_due') ||
    m.includes('payment_failed') ||
    m.includes('provider_error') ||
    m.includes('offene zahlung') ||
    (m.includes('failed') && m.includes('payment') && !m.includes('not configured'))
  );
}

export function isRealBackupFailure(
  backupConfigured: boolean | undefined,
  lastBackupStatus?: string,
  healthBackupStatus?: string,
  message?: string,
): boolean {
  if (backupConfigured !== true) return false;
  const m = (message ?? '').toLowerCase();
  if (lastBackupStatus === 'error' || lastBackupStatus === 'failed') return true;
  if (healthBackupStatus === 'error') return true;
  return (
    m.includes('last_backup_failed') ||
    m.includes('backup_job_error') ||
    m.includes('storage_unreachable') ||
    (m.includes('failed') && m.includes('backup') && !m.includes('not configured'))
  );
}

export function classifyMailForDisplay(mail?: HealthComponent | null): ComponentDisplay {
  const statusRaw = mail?.status;
  if (!statusRaw) {
    return {
      status: 'unknown',
      configured: false,
      displayValue: 'Nicht verfügbar',
      displaySubtitle: mail?.message ?? '',
    };
  }
  const status = parseHealthStatus(statusRaw);
  if (status === 'ok') {
    return {
      status: 'ok',
      configured: true,
      displayValue: 'OK',
      displaySubtitle: 'SMTP konfiguriert',
    };
  }
  if (statusRaw === 'not_configured' || isNotConfiguredMessage(mail?.message)) {
    return {
      status: 'unknown',
      configured: false,
      displayValue: 'Nicht konfiguriert',
      displaySubtitle: mail?.message ?? 'SMTP nicht eingerichtet',
    };
  }
  if (status === 'error') {
    return {
      status: 'error',
      configured: true,
      displayValue: 'Fehler',
      displaySubtitle: mail?.message ?? 'Mailfehler',
    };
  }
  if (status === 'warning') {
    return {
      status: 'warning',
      configured: true,
      displayValue: 'Warnung',
      displaySubtitle: mail?.message ?? 'Mail-Warnung',
    };
  }
  return {
    status: 'unknown',
    configured: false,
    displayValue: 'Nicht verfügbar',
    displaySubtitle: mail?.message ?? '',
  };
}

export function classifyPaymentsForDisplay(payments?: HealthComponent | null): ComponentDisplay {
  const statusRaw = payments?.status;
  const message = payments?.message;
  const openCases = payments?.openCases ?? 0;

  if (isPaymentProviderNotConfigured(statusRaw, message)) {
    return {
      status: 'unknown',
      configured: false,
      displayValue: 'Nicht konfiguriert',
      displaySubtitle: 'Zahlungssystem noch nicht angebunden',
    };
  }
  if (!statusRaw) {
    return {
      status: 'unknown',
      configured: false,
      displayValue: 'Nicht verfügbar',
      displaySubtitle: message ?? '',
    };
  }
  if (isRealPaymentIssue(message, openCases)) {
    return {
      status: 'warning',
      configured: true,
      displayValue: 'Warnung',
      displaySubtitle:
        openCases > 0 ? `${openCases} offene Fälle` : (message ?? 'Zahlungsproblem'),
    };
  }
  const status = parseHealthStatus(statusRaw);
  if (status === 'error') {
    return {
      status: 'error',
      configured: true,
      displayValue: 'Fehler',
      displaySubtitle: message ?? 'Zahlungsfehler',
    };
  }
  if (status === 'ok') {
    return {
      status: 'ok',
      configured: true,
      displayValue: 'OK',
      displaySubtitle: message ?? 'Keine offenen Zahlungsfälle',
    };
  }
  return {
    status: 'unknown',
    configured: false,
    displayValue: 'Nicht verfügbar',
    displaySubtitle: message ?? '',
  };
}

export function classifyBackupsForDisplay(
  healthBackups?: HealthComponent | null,
  backupMeta?: { configured?: boolean; message?: string; lastBackupStatus?: string },
): ComponentDisplay {
  const message = healthBackups?.message ?? backupMeta?.message;
  const healthStatus = healthBackups?.status;
  const notConfigured =
    backupMeta?.configured === false ||
    isBackupSystemNotConfigured(healthStatus, message);

  if (notConfigured) {
    return {
      status: 'unknown',
      configured: false,
      displayValue: 'Nicht konfiguriert',
      displaySubtitle: 'Backup-System noch nicht eingerichtet',
    };
  }
  if (healthStatus === 'ok' || backupMeta?.lastBackupStatus === 'success') {
    return {
      status: 'ok',
      configured: true,
      displayValue: 'OK',
      displaySubtitle: message ?? 'Backup erfolgreich',
    };
  }
  if (isRealBackupFailure(backupMeta?.configured, backupMeta?.lastBackupStatus, healthStatus, message)) {
    return {
      status: 'error',
      configured: true,
      displayValue: 'Fehler',
      displaySubtitle: message ?? 'Backup fehlgeschlagen',
    };
  }
  return {
    status: 'unknown',
    configured: backupMeta?.configured !== false,
    displayValue: 'Nicht verfügbar',
    displaySubtitle: message ?? 'Noch kein Backup gelaufen',
  };
}

/** Stellt sicher, dass alle Health-Teilbereiche existieren (kein Zugriff auf undefined.configured). */
export function ensureHealthShape(partial: Partial<HealthResponse> | HealthResponse): HealthResponse {
  const checkedAt =
    typeof partial.checkedAt === 'string' ? partial.checkedAt : new Date().toISOString();
  const mailPartial = partial.mail;
  const paymentsPartial = partial.payments;

  return {
    overallStatus: parseHealthStatus(partial.overallStatus ?? 'unknown'),
    overallLabel: partial.overallLabel,
    checkedAt,
    uptimeLabel: partial.uptimeLabel,
    app: {
      status: parseHealthStatus(partial.app?.status ?? 'unknown'),
      message: partial.app?.message ?? 'Nicht verfügbar',
    },
    api: {
      status: parseHealthStatus(partial.api?.status ?? 'unknown'),
      responseTimeMs: partial.api?.responseTimeMs ?? 0,
    },
    database: {
      status: parseHealthStatus(partial.database?.status ?? 'unknown'),
      connections: partial.database?.connections ?? 0,
    },
    mail: {
      status: parseHealthStatus(mailPartial?.status ?? 'unknown'),
      deliveryRate: mailPartial?.deliveryRate ?? 0,
      message: mailPartial?.message,
      configured: mailPartial?.configured ?? mailPartial?.status === 'ok',
    },
    payments: {
      status: parseHealthStatus(paymentsPartial?.status ?? 'unknown'),
      openCases: paymentsPartial?.openCases ?? 0,
      message: paymentsPartial?.message,
      configured: paymentsPartial?.configured,
    },
    backups: {
      status: parseHealthStatus(partial.backups?.status ?? 'unknown'),
      lastBackupAt: partial.backups?.lastBackupAt ?? checkedAt,
      nextBackupAt: partial.backups?.nextBackupAt ?? checkedAt,
    },
    storage: {
      status: parseHealthStatus(partial.storage?.status ?? 'unknown'),
      usedPercent: partial.storage?.usedPercent ?? 0,
      usedGb: partial.storage?.usedGb ?? 0,
      totalGb: partial.storage?.totalGb ?? 0,
    },
    uptime: {
      status: parseHealthStatus(partial.uptime?.status ?? 'unknown'),
      percent30Days: partial.uptime?.percent30Days ?? 0,
    },
    warnings: Array.isArray(partial.warnings) ? partial.warnings : [],
    errors: Array.isArray(partial.errors) ? partial.errors : [],
  };
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

  if (mail?.message && !isNotConfiguredMessage(mail.message) && componentStatus(health.mail) === 'warning') {
    warnings.push(`Mail: ${mail.message}`);
  }
  if (
    payments?.message &&
    !isPaymentProviderNotConfigured(payments.status, payments.message) &&
    componentStatus(health.payments) === 'warning'
  ) {
    warnings.push(`Zahlungen: ${payments.message}`);
  }
  if (storage?.message && componentStatus(health.storage) === 'warning') {
    warnings.push(`Speicher: ${storage.message}`);
  }

  return warnings;
}

/**
 * Normalisiert die Haupt-App Admin-Health-API (inkl. optional { ok, data }-Wrapper).
 */
export function normalizeHealthResponse(
  payload: unknown,
  backups: { configured?: boolean; lastBackup?: string | null; message?: string; lastBackupStatus?: string },
  responseTimeMs: number,
  apiReachable: boolean,
): HealthResponse {
  const health = unwrapHealthPayload(payload);
  return normalizeAdminHealthPayload(health, backups, responseTimeMs, apiReachable);
}

/** Normalisiert bereits entpackte Health-Daten in das Control-Center-Format. */
export function normalizeAdminHealthPayload(
  health: Record<string, unknown>,
  backups: { configured?: boolean; lastBackup?: string | null; message?: string; lastBackupStatus?: string },
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
      mail: { status: 'unknown', deliveryRate: 0, message: 'Nicht verfügbar', configured: false },
      payments: { status: 'unknown', openCases: 0, message: 'Nicht verfügbar', configured: false },
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
  const mailRaw = pickHealthComponent(health.mail);
  const paymentsRaw = pickHealthComponent(health.payments);
  const storage = pickHealthComponent(health.storage);
  const backupsHealth = pickHealthComponent(health.backups);
  const uptimeRaw = health.uptime;

  const mailDisplay = classifyMailForDisplay(mailRaw);
  const paymentsDisplay = classifyPaymentsForDisplay(paymentsRaw);
  const backupsDisplay = classifyBackupsForDisplay(backupsHealth, {
    configured: backups.configured,
    message: backups.message ?? backupsHealth?.message,
    lastBackupStatus: backups.lastBackupStatus,
  });

  const uptimeLabelStr = typeof uptimeRaw === 'string' ? uptimeRaw : undefined;
  const uptimePercent =
    typeof uptimeRaw === 'object' && uptimeRaw && !Array.isArray(uptimeRaw) ?
      Number((uptimeRaw as HealthComponent).percent30Days ?? 0)
    : 0;
  const uptimeStatus: HealthStatus =
    typeof uptimeRaw === 'string' ? 'ok' : parseHealthStatus(pickHealthComponent(uptimeRaw)?.status ?? 'unknown');

  const appStatus = parseHealthStatus(app?.status ?? 'ok');
  const apiStatus = parseHealthStatus(api?.status ?? 'ok');
  const dbStatus = parseHealthStatus(database?.status ?? 'ok');

  const errors: string[] = [];
  if (health.ok === false) errors.push('Haupt-App meldet Fehlerstatus');
  if (dbStatus === 'error' && database?.message) errors.push(database.message);

  const normalized: HealthResponse = {
    overallStatus: parseHealthStatus(
      typeof health.overallStatus === 'string' ? health.overallStatus : 'ok',
    ),
    checkedAt,
    app: {
      status: appStatus,
      message:
        app?.message ??
        (typeof health.product === 'string' ? health.product : undefined) ??
        (typeof health.service === 'string' ? health.service : undefined) ??
        'RabbitStation Haupt-App online',
    },
    api: {
      status: apiStatus,
      responseTimeMs: api?.responseTimeMs ?? responseTimeMs,
    },
    database: {
      status: dbStatus,
      connections: database?.connections ?? 0,
    },
    mail: {
      status: mailDisplay.status,
      deliveryRate: mailRaw?.deliveryRate ?? 0,
      message: mailDisplay.displaySubtitle,
      configured: mailDisplay.configured,
    },
    payments: {
      status: paymentsDisplay.status,
      openCases: paymentsRaw?.openCases ?? 0,
      message: paymentsDisplay.displaySubtitle,
      configured: paymentsDisplay.configured,
    },
    backups: {
      status: backupsDisplay.status,
      lastBackupAt: backupsHealth?.lastBackupAt ?? backups.lastBackup ?? checkedAt,
      nextBackupAt: backupsHealth?.nextBackupAt ?? checkedAt,
    },
    storage: {
      status: parseHealthStatus(storage?.status ?? 'ok'),
      usedPercent: storage?.usedPercent ?? 0,
      usedGb: storage?.usedGb ?? 0,
      totalGb: storage?.totalGb ?? 0,
    },
    uptime: {
      status: uptimeStatus,
      percent30Days: uptimePercent,
    },
    uptimeLabel: uptimeLabelStr,
    warnings: mergeComponentWarnings(health),
    errors,
  };

  return ensureHealthShape(normalized);
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
  const unwrapped = unwrapHealthPayload(health);
  const checkedAt =
    typeof unwrapped.checkedAt === 'string' ? unwrapped.checkedAt : new Date().toISOString();

  return {
    environment: typeof unwrapped.environment === 'string' ? unwrapped.environment : 'Produktion',
    region: 'Railway',
    version:
      typeof unwrapped.version === 'string' ? unwrapped.version
      : typeof unwrapped.product === 'string' ? unwrapped.product
      : 'RabbitStation Pro',
    build: typeof unwrapped.service === 'string' ? unwrapped.service : 'live',
    serverTime: checkedAt,
    uptime: uptimeLabel(unwrapped.uptime),
    systemLoadPercent: 0,
    nodeVersion: process.version,
    databaseVersion: databaseVersionLabel(unwrapped.database),
    lastDeploy: checkedAt,
    commitHash: 'live-api',
  };
}
