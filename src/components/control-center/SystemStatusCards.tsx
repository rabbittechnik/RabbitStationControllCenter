import {
  CheckCircle2,
  Code2,
  Database,
  Mail,
  CreditCard,
  Cloud,
  HardDrive,
  Clock,
  Monitor,
} from 'lucide-react';
import { StatusCard } from './StatusCard';
import type { BackupStatus, HealthResponse, HealthStatus } from '../../types';
import { uptimeDisplaySubtitle, uptimeDisplayValue } from '../../utils/healthNormalize';
import {
  backupCardValue,
  mailCardValue,
  mailConfiguredFlag,
  notCheckableCardValue,
  paymentsCardValue,
  paymentsConfiguredFlag,
  serverApiOffline,
  statusVariant,
} from '../../utils/healthDisplay';
import { formatTime } from '../../utils/format';
import { safeText } from '../../utils/safeDisplay';

interface SystemStatusCardsProps {
  health: HealthResponse | null;
  backups?: BackupStatus | null;
  loading?: boolean;
  unavailable?: boolean;
}

function coreLabel(status: HealthStatus | undefined, ok: string, bad: string): string {
  if (status === 'ok') return ok;
  if (status === 'unknown') return 'Nicht prüfbar';
  return bad;
}

export function SystemStatusCards({ health, backups, loading, unavailable }: SystemStatusCardsProps) {
  if (loading || !health) {
    return <StatusCardsSkeleton unavailable={unavailable} loading={loading} />;
  }

  const apiDown = serverApiOffline(health);
  const mail = health.mail;
  const payments = health.payments;
  const backupConfigured = backups?.configured === true;
  const mailOk = mailConfiguredFlag(mail);

  const mailValue = apiDown ? notCheckableCardValue() : mailCardValue(mail);

  const mailSubtitle =
    apiDown ?
      'Nicht prüfbar – Server/API offline'
    : mailOk && mail?.status === 'ok' ?
      safeText(mail?.message, 'Mailversand konfiguriert')
    : safeText(mail?.message, 'SMTP-Status unbekannt');

  const paymentsValue = apiDown ? notCheckableCardValue() : paymentsCardValue(payments);

  const paymentsSubtitle =
    apiDown ?
      'Nicht prüfbar – Server/API offline'
    : !paymentsConfiguredFlag(payments) ?
      'Zahlungssystem noch nicht angebunden'
    : (payments?.openCases ?? 0) > 0 ?
      `${payments.openCases} offene Fälle`
    : safeText(payments?.message, 'Keine offenen Zahlungsfälle');

  const backupValue = apiDown ? notCheckableCardValue() : backupCardValue(backups);

  const backupSubtitle =
    apiDown ?
      'Nicht prüfbar – Server/API offline'
    : backupConfigured === false ?
      safeText(backups?.message, 'Backup-System noch nicht eingerichtet')
    : backups?.lastBackupAt ?
      `Letztes: ${formatTime(backups.lastBackupAt)}`
    : 'Noch kein Backup gelaufen';

  const fe = health.frontend ?? health.app;
  const api = health.serverApi ?? health.api;

  const frontendStatus = fe?.status ?? health.app?.status;
  const serverStatus = api?.status ?? health.api?.status;

  const cards = [
    {
      title: 'Frontend',
      value: coreLabel(frontendStatus, 'Online', 'Offline'),
      subtitle: safeText(
        typeof fe === 'object' && 'message' in (fe as object) ? (fe as { message?: string }).message : health.app?.message,
        'Client erreichbar',
      ),
      icon: Monitor,
      variant: statusVariant(frontendStatus),
      showPulse: frontendStatus === 'ok',
    },
    {
      title: 'Server/API',
      value: coreLabel(serverStatus, 'Online', 'Offline'),
      subtitle:
        typeof api === 'object' && 'responseTimeMs' in (api as object) && (api as { responseTimeMs?: number }).responseTimeMs ?
          `Antwortzeit ${(api as { responseTimeMs: number }).responseTimeMs} ms`
        : safeText(
            typeof api === 'object' && 'message' in (api as object) ? (api as { message?: string }).message : undefined,
            serverStatus === 'ok' ? 'Healthcheck OK' : 'Healthcheck fehlgeschlagen',
          ),
      icon: Code2,
      variant: statusVariant(serverStatus),
    },
    {
      title: 'Datenbank',
      value: apiDown ? notCheckableCardValue() : coreLabel(health.database?.status, 'OK', 'Fehler'),
      subtitle:
        apiDown ?
          'API offline'
        : health.database?.connections != null ?
          `Verbindungen ${health.database.connections}`
        : 'Nicht verfügbar',
      icon: Database,
      variant: apiDown ? ('neutral' as const) : statusVariant(health.database?.status),
    },
    {
      title: 'Mail',
      value: mailValue,
      subtitle: mailSubtitle,
      icon: Mail,
      variant:
        apiDown ? ('neutral' as const)
        : !mailOk ? ('neutral' as const)
        : statusVariant(mail?.status),
    },
    {
      title: 'Zahlungen',
      value: paymentsValue,
      subtitle: paymentsSubtitle,
      icon: CreditCard,
      variant:
        apiDown ? ('neutral' as const)
        : !paymentsConfiguredFlag(payments) ? ('neutral' as const)
        : statusVariant(payments?.status),
    },
    {
      title: 'Backups',
      value: backupValue,
      subtitle: backupSubtitle,
      icon: Cloud,
      variant:
        apiDown ? ('neutral' as const)
        : backupConfigured === false ? ('neutral' as const)
        : statusVariant(health.backups?.status),
    },
    {
      title: 'Speicher',
      value:
        apiDown ?
          notCheckableCardValue()
        : health.storage?.usedPercent != null && health.storage.usedPercent > 0 ?
          `${health.storage.usedPercent} %`
        : 'Nicht verfügbar',
      subtitle:
        apiDown ?
          'API offline'
        : health.storage?.usedGb != null && health.storage?.totalGb ?
          `${health.storage.usedGb} GB / ${health.storage.totalGb} GB`
        : 'Metrik nicht verfügbar',
      icon: HardDrive,
      variant: apiDown ? ('neutral' as const) : ('cyan' as const),
      ringPercent: apiDown ? 0 : (health.storage?.usedPercent ?? 0),
      showSparkline: false,
    },
    {
      title: 'Uptime',
      value: apiDown ? notCheckableCardValue() : uptimeDisplayValue(health),
      subtitle: apiDown ? 'API offline' : uptimeDisplaySubtitle(health),
      icon: Clock,
      variant:
        apiDown ? ('neutral' as const)
        : health.uptimeLabel ? ('ok' as const)
        : ('neutral' as const),
      showSparkline: false,
    },
  ];

  return <StatusCardsGrid cards={cards} />;
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
        Systemstatus: Nicht verfügbar — Verbindung zur Haupt-App prüfen.
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
