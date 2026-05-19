import {
  CheckCircle2,
  Code2,
  Database,
  Mail,
  CreditCard,
  Cloud,
  HardDrive,
  Clock,
} from 'lucide-react';
import { StatusCard } from './StatusCard';
import type { BackupStatus, HealthResponse, HealthStatus } from '../../types';
import { uptimeDisplaySubtitle, uptimeDisplayValue } from '../../utils/healthNormalize';
import { formatTime } from '../../utils/format';
import { safeText } from '../../utils/safeDisplay';

interface SystemStatusCardsProps {
  health: HealthResponse | null;
  backups?: BackupStatus | null;
  loading?: boolean;
  unavailable?: boolean;
}

function statusVariant(status: HealthStatus | undefined): 'ok' | 'warning' | 'error' | 'neutral' {
  if (status === 'ok') return 'ok';
  if (status === 'unknown') return 'neutral';
  if (status === 'warning') return 'warning';
  return 'error';
}

function coreLabel(status: HealthStatus | undefined, ok: string, bad: string): string {
  if (status === 'ok') return ok;
  if (status === 'unknown') return 'Nicht verfügbar';
  return bad;
}

export function SystemStatusCards({ health, backups, loading, unavailable }: SystemStatusCardsProps) {
  if (loading || !health) {
    return <StatusCardsSkeleton unavailable={unavailable} loading={loading} />;
  }

  const mail = health.mail;
  const payments = health.payments;
  const backupConfigured = backups?.configured === true;

  const mailValue =
    mail.configured === false ? 'Nicht konfiguriert'
    : mail.status === 'warning' ? 'Warnung'
    : mail.status === 'error' ? 'Fehler'
    : 'OK';

  const mailSubtitle = safeText(mail.message, 'SMTP-Status unbekannt');

  const paymentsValue =
    payments.configured === false ? 'Nicht konfiguriert'
    : payments.openCases && payments.openCases > 0 ? 'Warnung'
    : payments.status === 'error' ? 'Fehler'
    : 'OK';

  const paymentsSubtitle =
    payments.configured === false ?
      'Zahlungssystem noch nicht angebunden'
    : payments.openCases && payments.openCases > 0 ?
      `${payments.openCases} offene Fälle`
    : safeText(payments.message, 'Keine offenen Zahlungsfälle');

  const backupValue =
    backupConfigured === false ? 'Nicht konfiguriert'
    : backups?.lastBackupStatus === 'success' ? 'OK'
    : backups?.lastBackupStatus === 'error' || backups?.lastBackupStatus === 'failed' ? 'Fehler'
    : 'Unbekannt';

  const backupSubtitle =
    backupConfigured === false ?
      safeText(backups?.message, 'Backup-System noch nicht eingerichtet')
    : backups?.lastBackupAt ?
      `Letztes: ${formatTime(backups.lastBackupAt)}`
    : 'Noch kein Backup gelaufen';

  const cards = [
    {
      title: 'App Online',
      value: coreLabel(health.app?.status, 'Online', 'Offline'),
      subtitle: health.app?.message ?? 'Nicht verfügbar',
      icon: CheckCircle2,
      variant: statusVariant(health.app?.status),
      showPulse: health.app?.status === 'ok',
    },
    {
      title: 'API',
      value: coreLabel(health.api?.status, 'OK', 'Fehler'),
      subtitle:
        health.api?.responseTimeMs != null && health.api.responseTimeMs > 0 ?
          `Antwortzeit ${health.api.responseTimeMs} ms`
        : 'Nicht verfügbar',
      icon: Code2,
      variant: statusVariant(health.api?.status),
    },
    {
      title: 'Datenbank',
      value: coreLabel(health.database?.status, 'OK', 'Fehler'),
      subtitle:
        health.database?.connections != null ?
          `Verbindungen ${health.database.connections}`
        : 'Nicht verfügbar',
      icon: Database,
      variant: statusVariant(health.database?.status),
    },
    {
      title: 'Mail',
      value: mailValue,
      subtitle: mailSubtitle,
      icon: Mail,
      variant:
        mail.configured === false ? ('neutral' as const)
        : statusVariant(mail.status),
    },
    {
      title: 'Zahlungen',
      value: paymentsValue,
      subtitle: paymentsSubtitle,
      icon: CreditCard,
      variant:
        payments.configured === false ? ('neutral' as const)
        : statusVariant(payments.status),
    },
    {
      title: 'Backups',
      value: backupValue,
      subtitle: backupSubtitle,
      icon: Cloud,
      variant:
        backupConfigured === false ? ('neutral' as const)
        : statusVariant(health.backups?.status),
    },
    {
      title: 'Speicher',
      value:
        health.storage?.usedPercent != null && health.storage.usedPercent > 0 ?
          `${health.storage.usedPercent} %`
        : 'Nicht verfügbar',
      subtitle:
        health.storage?.usedGb != null && health.storage?.totalGb ?
          `${health.storage.usedGb} GB / ${health.storage.totalGb} GB`
        : 'Metrik nicht verfügbar',
      icon: HardDrive,
      variant: 'cyan' as const,
      ringPercent: health.storage?.usedPercent ?? 0,
      showSparkline: false,
    },
    {
      title: 'Haupt-App Laufzeit',
      value: uptimeDisplayValue(health),
      subtitle: uptimeDisplaySubtitle(health),
      icon: Clock,
      variant: health.uptimeLabel ? ('ok' as const) : ('neutral' as const),
      showSparkline: false,
    },
  ];

  return (
    <StatusCardsGrid cards={cards} />
  );
}

function StatusCardsGrid({
  cards,
}: {
  cards: Array<{
    title: string;
    value: string;
    subtitle: string;
    icon: typeof CheckCircle2;
    variant: 'ok' | 'warning' | 'error' | 'neutral' | 'cyan';
    showPulse?: boolean;
    showSparkline?: boolean;
    ringPercent?: number;
  }>;
}) {
  return (
    <div id="cc-section-system" className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:grid-cols-8">
      {cards.map((card, i) => (
        <StatusCard key={card.title} {...card} index={i} />
      ))}
    </div>
  );
}

function StatusCardsSkeleton({
  unavailable,
  loading,
}: {
  unavailable?: boolean;
  loading?: boolean;
}) {
  if (unavailable && !loading) {
    return (
      <p className="glass-card p-4 text-sm text-slate-500">
        Systemstatus: Nicht verfügbar — Haupt-App nicht verbunden.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:grid-cols-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="glass-card h-24 animate-pulse p-4" />
      ))}
    </div>
  );
}
