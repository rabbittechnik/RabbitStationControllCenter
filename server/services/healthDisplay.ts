import type { BackupStatus, HealthResponse, HealthStatus, SystemLog } from '../types.js';
import { hasRecentMailFailure } from './logFormat.js';

export type OverallDisplayStatus = 'operational' | 'warning' | 'partial' | 'outage';

function isNotConfiguredMessage(msg?: string): boolean {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return (
    m.includes('not configured') ||
    m.includes('nicht konfiguriert') ||
    m.includes('noch nicht') ||
    m.includes('fehlt') ||
    m.includes('missing')
  );
}

function smtpNotConfigured(mailMessage?: string): boolean {
  if (!mailMessage) return true;
  const m = mailMessage.toLowerCase();
  return m.includes('smtp') && (m.includes('not configured') || m.includes('nicht'));
}

function paymentsNotConfigured(paymentsMessage?: string): boolean {
  if (!paymentsMessage) return true;
  const m = paymentsMessage.toLowerCase();
  return m.includes('payment') && m.includes('not configured');
}

/** Berechnet realistischen Gesamtstatus – „nicht konfiguriert“ zählt nicht als Störung. */
export function computeOverallDisplayStatus(
  health: HealthResponse,
  backups: BackupStatus,
  logs: SystemLog[],
): { status: HealthStatus; label: OverallDisplayStatus } {
  const critical =
    health.app.status === 'error' ||
    health.api.status === 'error' ||
    health.database.status === 'error' ||
    health.errors.length > 0;

  if (critical) {
    return { status: 'error', label: 'outage' };
  }

  const mailMsg = (health.mail as { message?: string }).message;
  const mailConfigured = !smtpNotConfigured(mailMsg);
  const mailFailed = hasRecentMailFailure(logs);

  const paymentsMsg = (health.payments as { message?: string }).message;
  const paymentsConfigured = !paymentsNotConfigured(paymentsMsg);
  const openPayments = (health.payments.openCases ?? 0) > 0;

  const backupFailed =
    backups.configured === true &&
    (backups.lastBackupStatus === 'error' || backups.lastBackupStatus === 'failed');

  const hasWarning =
    (mailConfigured && (mailFailed || health.mail.status === 'error')) ||
    (paymentsConfigured && (openPayments || health.payments.status === 'error')) ||
    backupFailed;

  const partialOnly =
    !hasWarning &&
    (!mailConfigured || !paymentsConfigured || backups.configured === false);

  if (hasWarning) {
    return { status: 'warning', label: 'warning' };
  }
  if (partialOnly) {
    return { status: 'warning', label: 'partial' };
  }
  return { status: 'ok', label: 'operational' };
}

export function refineHealthComponents(
  health: HealthResponse,
  backups: BackupStatus,
  logs: SystemLog[],
): HealthResponse {
  const mailMsg = (health.mail as { message?: string }).message ?? '';
  const paymentsMsg = (health.payments as { message?: string }).message ?? '';
  const mailConfigured = !smtpNotConfigured(mailMsg);
  const paymentsConfigured = !paymentsNotConfigured(paymentsMsg);
  const mailFailed = hasRecentMailFailure(logs);

  let mailStatus: HealthStatus = 'ok';
  if (!mailConfigured) {
    mailStatus = 'unknown';
  } else if (mailFailed) {
    mailStatus = 'warning';
  } else if (isNotConfiguredMessage(mailMsg)) {
    mailStatus = 'unknown';
  }

  let paymentsStatus: HealthStatus = 'ok';
  if (!paymentsConfigured) {
    paymentsStatus = 'unknown';
  } else if ((health.payments.openCases ?? 0) > 0) {
    paymentsStatus = 'warning';
  }

  let backupHealthStatus: HealthStatus = 'ok';
  if (backups.configured === false) {
    backupHealthStatus = 'unknown';
  } else if (backups.lastBackupStatus === 'error' || backups.lastBackupStatus === 'failed') {
    backupHealthStatus = 'error';
  } else if (backups.lastBackupStatus !== 'success') {
    backupHealthStatus = 'warning';
  }

  const overall = computeOverallDisplayStatus(health, backups, logs);

  return {
    ...health,
    overallStatus: overall.status,
    overallLabel: overall.label,
    mail: {
      ...health.mail,
      status: mailStatus,
      message:
        !mailConfigured ? 'SMTP nicht konfiguriert'
        : mailFailed ? 'Letzte Mail-Zustellung fehlgeschlagen'
        : mailMsg || 'Mailversand bereit',
      configured: mailConfigured,
    },
    payments: {
      ...health.payments,
      status: paymentsStatus,
      message:
        !paymentsConfigured ?
          'Zahlungssystem noch nicht angebunden'
        : paymentsMsg,
      configured: paymentsConfigured,
    },
    backups: {
      ...health.backups,
      status: backupHealthStatus,
    },
    storage: {
      ...health.storage,
      status: health.storage.usedPercent > 0 ? health.storage.status : 'unknown',
    },
    uptime: {
      ...health.uptime,
      status: health.uptimeLabel ? 'ok' : 'unknown',
    },
  };
}
