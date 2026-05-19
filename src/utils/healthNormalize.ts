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

function unwrapHealthPayload(partial: unknown): Partial<HealthResponse> | null {
  if (!partial || typeof partial !== 'object') return null;
  const obj = partial as Record<string, unknown>;
  if (
    obj.ok === true &&
    obj.data != null &&
    typeof obj.data === 'object' &&
    !Array.isArray(obj.data)
  ) {
    return obj.data as Partial<HealthResponse>;
  }
  return partial as Partial<HealthResponse>;
}

function pickRawComponent(raw: unknown): Component | null {
  return pickComponent(raw);
}

/** Client-seitige Normalisierung — gleiche Defaults wie auf dem Server. */
export function normalizeMainAppHealth(payload: unknown): Partial<HealthResponse> {
  const raw = unwrapHealthPayload(payload) ?? {};
  const mailStatus = parseStatus(raw.mail?.status ?? (pickRawComponent(raw.mail)?.status as string), 'unknown');
  const mailC = pickRawComponent(raw.mail);

  return {
    ...raw,
    overallStatus: parseStatus(raw.overallStatus, 'unknown'),
    checkedAt: typeof raw.checkedAt === 'string' ? raw.checkedAt : new Date().toISOString(),
    app: {
      status: parseStatus(raw.app?.status ?? pickRawComponent(raw.app)?.status, 'unknown'),
      message: safeText(raw.app?.message ?? pickRawComponent(raw.app)?.message, 'Keine App-Meldung verfügbar'),
    },
    api: {
      status: parseStatus(raw.api?.status ?? pickRawComponent(raw.api)?.status, 'unknown'),
      responseTimeMs: safeNumber(raw.api?.responseTimeMs ?? pickRawComponent(raw.api)?.responseTimeMs, 0),
    },
    database: {
      status: parseStatus(raw.database?.status ?? pickRawComponent(raw.database)?.status, 'unknown'),
      connections: safeNumber(raw.database?.connections ?? pickRawComponent(raw.database)?.connections, 0),
    },
    mail: {
      status: mailStatus,
      deliveryRate: safeNumber(mailC?.deliveryRate, 0),
      message: safeText(
        mailC?.message,
        mailStatus === 'ok' ? 'Mailversand konfiguriert' : 'Keine Mail-Meldung verfügbar',
      ),
      configured: raw.mail?.configured === true || mailC?.configured === true || mailStatus === 'ok',
    },
    payments: {
      status: parseStatus(raw.payments?.status ?? pickRawComponent(raw.payments)?.status, 'unknown'),
      openCases: safeNumber(raw.payments?.openCases ?? pickRawComponent(raw.payments)?.openCases, 0),
      message: safeText(pickRawComponent(raw.payments)?.message, 'Keine Zahlungs-Meldung verfügbar'),
      configured: raw.payments?.configured === true,
    },
    backups: {
      status: parseStatus(raw.backups?.status ?? pickRawComponent(raw.backups)?.status, 'unknown'),
      lastBackupAt: safeText(pickRawComponent(raw.backups)?.lastBackupAt, raw.checkedAt ?? ''),
      nextBackupAt: safeText(pickRawComponent(raw.backups)?.nextBackupAt, raw.checkedAt ?? ''),
    },
    storage: {
      status: parseStatus(raw.storage?.status ?? pickRawComponent(raw.storage)?.status, 'unknown'),
      usedPercent: safeNumber(pickRawComponent(raw.storage)?.usedPercent, 0),
      usedGb: safeNumber(pickRawComponent(raw.storage)?.usedGb, 0),
      totalGb: safeNumber(pickRawComponent(raw.storage)?.totalGb, 0),
    },
    uptime:
      typeof raw.uptime === 'string' ?
        { status: 'ok' as HealthStatus, percent30Days: 0 }
      : {
          status: parseStatus(pickRawComponent(raw.uptime)?.status, 'unknown'),
          percent30Days: safeNumber(pickRawComponent(raw.uptime)?.percent30Days, 0),
        },
    uptimeLabel: typeof raw.uptimeLabel === 'string' ? raw.uptimeLabel : undefined,
    warnings: Array.isArray(raw.warnings) ? raw.warnings.map((w) => safeText(w)) : [],
    errors: Array.isArray(raw.errors) ? raw.errors.map((e) => safeText(e)) : [],
  };
}

/** Client-seitige Absicherung — auch wenn die API noch Objekte in String-Feldern liefert. */
export function normalizeHealthResponse(partial?: Partial<HealthResponse> | null | unknown): HealthResponse {
  const source = normalizeMainAppHealth(partial ?? {});
  const checkedAt =
    typeof source?.checkedAt === 'string' ? source.checkedAt : new Date().toISOString();

  const app = mergeComponent(
    { status: 'unknown' as HealthStatus, message: 'Nicht verfügbar' },
    source?.app,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      message: safeText(c?.message, 'Nicht verfügbar'),
    }),
  );

  const api = mergeComponent(
    { status: 'unknown' as HealthStatus, responseTimeMs: 0 },
    source?.api,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      responseTimeMs: safeNumber(c?.responseTimeMs, 0),
    }),
  );

  const database = mergeComponent(
    { status: 'unknown' as HealthStatus, connections: 0 },
    source?.database,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      connections: safeNumber(c?.connections, 0),
    }),
  );

  const mail = mergeComponent(
    { status: 'unknown' as HealthStatus, deliveryRate: 0, message: undefined, configured: false },
    source?.mail,
    (c) => {
      const status = parseStatus(c?.status, 'unknown');
      const configured =
        source?.mail?.configured === true || status === 'ok';
      return {
        status,
        deliveryRate: safeNumber(c?.deliveryRate, 0),
        message:
          typeof c?.message === 'string' && c.message.trim() ? c.message
          : typeof source?.mail?.message === 'string' && source.mail.message.trim() ? source.mail.message
          : status === 'ok' ? 'Mailversand konfiguriert'
          : 'Keine Mail-Meldung verfügbar',
        configured,
      };
    },
  );

  const payments = mergeComponent(
    { status: 'unknown' as HealthStatus, openCases: 0, message: undefined, configured: false },
    source?.payments,
    (c) => {
      const status = parseStatus(c?.status, 'unknown');
      const message =
        typeof c?.message === 'string' ? c.message
        : source?.payments?.message;
      const msgLower = (message ?? '').toLowerCase();
      const configured =
        source?.payments?.configured === true ?
          true
        : source?.payments?.configured === false ?
          false
        : msgLower.includes('payment provider not configured') ?
          false
        : status === 'ok';
      return {
        status,
        openCases: safeNumber(c?.openCases, 0),
        message:
          !configured && msgLower.includes('not configured') ?
            'Zahlungssystem noch nicht angebunden'
          : message,
        configured,
      };
    },
  );

  const backups = mergeComponent(
    {
      status: 'unknown' as HealthStatus,
      lastBackupAt: checkedAt,
      nextBackupAt: checkedAt,
    },
    source?.backups,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      lastBackupAt: safeText(c?.lastBackupAt, checkedAt),
      nextBackupAt: safeText(c?.nextBackupAt, checkedAt),
    }),
  );

  const storage = mergeComponent(
    { status: 'unknown' as HealthStatus, usedPercent: 0, usedGb: 0, totalGb: 0 },
    source?.storage,
    (c) => ({
      status: parseStatus(c?.status, 'unknown'),
      usedPercent: safeNumber(c?.usedPercent, 0),
      usedGb: safeNumber(c?.usedGb, 0),
      totalGb: safeNumber(c?.totalGb, 0),
    }),
  );

  let uptime: HealthResponse['uptime'];
  if (typeof source?.uptime === 'string') {
    uptime = { status: 'ok', percent30Days: 0 };
  } else {
    uptime = mergeComponent(
      { status: 'unknown' as HealthStatus, percent30Days: 0 },
      source?.uptime,
      (c) => ({
        status: parseStatus(c?.status, 'unknown'),
        percent30Days: safeNumber(c?.percent30Days, 0),
      }),
    );
  }

  return {
    overallStatus: parseStatus(source?.overallStatus, 'unknown'),
    overallLabel: source?.overallLabel,
    checkedAt,
    uptimeLabel: typeof source?.uptimeLabel === 'string' ? source.uptimeLabel : undefined,
    app,
    api,
    database,
    mail,
    payments,
    backups,
    storage,
    uptime,
    warnings: Array.isArray(source?.warnings) ? source.warnings.map((w) => safeText(w)) : [],
    errors: Array.isArray(source?.errors) ? source.errors.map((e) => safeText(e)) : [],
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
