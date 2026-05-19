import type { BackupStatus, HealthResponse, HealthStatus, SystemLog } from '../types.js';
import { hasRecentMailFailure } from './logFormat.js';
import {
  classifyBackupsForDisplay,
  classifyMailForDisplay,
  classifyPaymentsForDisplay,
  ensureHealthShape,
  isRealBackupFailure,
} from './healthNormalize.js';

export type OverallDisplayStatus = 'operational' | 'warning' | 'partial' | 'outage';

/** Berechnet realistischen Gesamtstatus – „nicht konfiguriert“ zählt nicht als Störung. */
export function computeOverallDisplayStatus(
  healthInput: HealthResponse,
  backupsInput: BackupStatus | null | undefined,
  logs: SystemLog[],
): { status: HealthStatus; label: OverallDisplayStatus } {
  const health = ensureHealthShape(healthInput);
  const backups: BackupStatus = backupsInput ?? {
    lastBackupAt: '',
    lastBackupStatus: 'unknown',
    nextBackupAt: '',
    sizeBytes: 0,
    configured: false,
    message: 'Nicht verfügbar',
  };

  const critical =
    health.app?.status === 'error' ||
    health.api?.status === 'error' ||
    health.database?.status === 'error' ||
    (health.errors?.length ?? 0) > 0;

  if (critical) {
    return { status: 'error', label: 'outage' };
  }

  const mailConfigured =
    health.mail?.configured === true || health.mail?.status === 'ok';
  const mailFailed = hasRecentMailFailure(logs);
  const mailWarning =
    mailConfigured &&
    (mailFailed || health.mail?.status === 'error' || health.mail?.status === 'warning');

  const paymentsConfigured = health.payments?.configured !== false;
  const paymentsWarning =
    paymentsConfigured &&
    (health.payments?.status === 'error' ||
      health.payments?.status === 'warning' ||
      (health.payments?.openCases ?? 0) > 0);

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
    (health.mail?.configured === false ||
      health.payments?.configured === false ||
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
  healthInput: HealthResponse,
  backups: BackupStatus,
  logs: SystemLog[],
): HealthResponse {
  const health = ensureHealthShape(healthInput);

  const mailDisplay = classifyMailForDisplay({
    status: health.mail?.status,
    message: health.mail?.message,
    deliveryRate: health.mail?.deliveryRate,
  });
  const paymentsDisplay = classifyPaymentsForDisplay({
    status: health.payments?.status,
    message: health.payments?.message,
    openCases: health.payments?.openCases,
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

  return ensureHealthShape({
    ...health,
    overallStatus: overall.status,
    overallLabel: overall.label,
    mail: {
      status: mailDisplay.status,
      deliveryRate: health.mail?.deliveryRate ?? 0,
      configured: mailDisplay.configured,
      message: mailDisplay.displaySubtitle,
    },
    payments: {
      status: paymentsDisplay.status,
      openCases: health.payments?.openCases ?? 0,
      configured: paymentsDisplay.configured,
      message: paymentsDisplay.displaySubtitle,
    },
    backups: {
      status: backupsDisplay.status,
      lastBackupAt: health.backups?.lastBackupAt ?? health.checkedAt,
      nextBackupAt: health.backups?.nextBackupAt ?? health.checkedAt,
    },
    storage: {
      ...health.storage,
      status: (health.storage?.usedPercent ?? 0) > 0 ? health.storage.status : 'unknown',
    },
    uptime: {
      ...health.uptime,
      status: health.uptimeLabel ? 'ok' : health.uptime.status,
    },
  });
}
