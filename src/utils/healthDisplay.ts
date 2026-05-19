import type { BackupStatus, HealthResponse, HealthStatus } from '../types';

export function mailConfiguredFlag(mail: HealthResponse['mail'] | null | undefined): boolean {
  return mail?.configured === true || mail?.status === 'ok';
}

export function paymentsConfiguredFlag(
  payments: HealthResponse['payments'] | null | undefined,
): boolean {
  if (payments?.configured === false) return false;
  const msg = (payments?.message ?? '').toLowerCase();
  if (msg.includes('payment provider not configured')) return false;
  if (payments?.status === 'not_configured') return false;
  return payments?.configured === true || payments?.status === 'ok' || payments?.status === 'warning';
}

export function mailCardValue(mail: HealthResponse['mail'] | null | undefined): string {
  if (!mail) return 'Nicht verfügbar';
  if (!mailConfiguredFlag(mail)) return 'Nicht konfiguriert';
  if (mail.status === 'warning') return 'Warnung';
  if (mail.status === 'error') return 'Fehler';
  return 'OK';
}

export function paymentsCardValue(payments: HealthResponse['payments'] | null | undefined): string {
  if (!payments) return 'Nicht verfügbar';
  if (!paymentsConfiguredFlag(payments)) return 'Nicht konfiguriert';
  if ((payments.openCases ?? 0) > 0) return 'Warnung';
  if (payments.status === 'error') return 'Fehler';
  return 'OK';
}

export function backupCardValue(backups: BackupStatus | null | undefined): string {
  if (!backups) return 'Nicht verfügbar';
  if (backups.configured === false) return 'Nicht konfiguriert';
  if (backups.lastBackupStatus === 'success') return 'OK';
  if (backups.lastBackupStatus === 'error' || backups.lastBackupStatus === 'failed') return 'Fehler';
  return 'Unbekannt';
}

export function statusVariant(status: HealthStatus | undefined): 'ok' | 'warning' | 'error' | 'neutral' {
  if (status === 'ok') return 'ok';
  if (status === 'unknown') return 'neutral';
  if (status === 'warning') return 'warning';
  return 'error';
}
