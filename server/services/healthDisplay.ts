import type { BackupStatus, HealthResponse, HealthStatus, SystemLog } from '../types.js';
import { hasRecentMailFailure } from './logFormat.js';
import {
  classifyBackupsForDisplay,
  classifyMailForDisplay,
  classifyPaymentsForDisplay,
  isRealBackupFailure,
} from './healthNormalize.js';

export type OverallDisplayStatus = 'operational' | 'warning' | 'partial' | 'outage';

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

  const mailConfigured = health.mail.configured !== false;
  const mailFailed = hasRecentMailFailure(logs);
  const mailWarning =
    mailConfigured &&
    (mailFailed || health.mail.status === 'error' || health.mail.status === 'warning');

  const paymentsConfigured = health.payments.configured !== false;
  const paymentsWarning =
    paymentsConfigured &&
    (health.payments.status === 'error' ||
      health.payments.status === 'warning' ||
      (health.payments.openCases ?? 0) > 0);

  const backupConfigured = backups.configured === true;
  const backupFailed = isRealBackupFailure(
    backups.configured,
    backups.lastBackupStatus,
    health.backups?.status,
    backups.message,
  );

  const hasWarning = mailWarning || paymentsWarning || backupFailed;

  const partialOnly =
    !hasWarning &&
    (health.mail.configured === false ||
      health.payments.configured === false ||
      backups.configured === false);

  if (hasWarning) {
    return { status: 'warning', label: 'warning' };
  }
  if (partialOnly) {
    return { status: 'ok', label: 'partial' };
  }
  return { status: 'ok', label: 'operational' };
}

export function refineHealthComponents(
  health: HealthResponse,
  backups: BackupStatus,
  logs: SystemLog[],
): HealthResponse {
  const mailDisplay = classifyMailForDisplay({
    status: health.mail.status,
    message: health.mail.message,
    deliveryRate: health.mail.deliveryRate,
  });
  const paymentsDisplay = classifyPaymentsForDisplay({
    status: health.payments.status,
    message: health.payments.message,
    openCases: health.payments.openCases,
  });
  const backupsDisplay = classifyBackupsForDisplay(
    { status: health.backups?.status, message: backups.message },
    {
      configured: backups.configured,
      message: backups.message,
      lastBackupStatus: backups.lastBackupStatus,
    },
  );

  const overall = computeOverallDisplayStatus(health, backups, logs);

  return {
    ...health,
    overallStatus: overall.status,
    overallLabel: overall.label,
    mail: {
      ...health.mail,
      status: mailDisplay.status,
      configured: mailDisplay.configured,
      message: mailDisplay.displaySubtitle,
    },
    payments: {
      ...health.payments,
      status: paymentsDisplay.status,
      configured: paymentsDisplay.configured,
      message: paymentsDisplay.displaySubtitle,
    },
    backups: {
      ...health.backups,
      status: backupsDisplay.status,
    },
    storage: {
      ...health.storage,
      status: health.storage.usedPercent > 0 ? health.storage.status : 'unknown',
    },
    uptime: {
      ...health.uptime,
      status: health.uptimeLabel ? 'ok' : health.uptime.status,
    },
  };
}
