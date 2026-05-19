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
import type { HealthResponse, HealthStatus } from '../../types';
import { uptimeDisplaySubtitle, uptimeDisplayValue } from '../../utils/healthNormalize';
import { formatTime } from '../../utils/format';
import { safeText } from '../../utils/safeDisplay';

interface SystemStatusCardsProps {
  health: HealthResponse | null;
  loading?: boolean;
  unavailable?: boolean;
}

function statusLabel(status: HealthStatus | undefined, ok: string, bad: string): string {
  if (status === 'ok') return ok;
  if (status === 'unknown') return 'Nicht verfügbar';
  return bad;
}

function statusVariant(status: HealthStatus | undefined): 'ok' | 'warning' | 'error' {
  if (status === 'ok') return 'ok';
  if (status === 'warning') return 'warning';
  if (status === 'unknown') return 'warning';
  return 'error';
}

export function SystemStatusCards({ health, loading, unavailable }: SystemStatusCardsProps) {
  if (loading || !health) {
    return (
      <StatusCardsSkeleton unavailable={unavailable} loading={loading} />
    );
  }

  const app = health.app;
  const api = health.api;
  const database = health.database;
  const mail = health.mail;
  const payments = health.payments;
  const backups = health.backups;
  const storage = health.storage;
  const uptime = health.uptime;

  const cards = [
    {
      title: 'App Online',
      value: statusLabel(app?.status, 'Online', 'Offline'),
      subtitle: app?.message ?? 'Nicht verfügbar',
      icon: CheckCircle2,
      variant: statusVariant(app?.status),
      showPulse: app?.status === 'ok',
    },
    {
      title: 'API',
      value: statusLabel(api?.status, 'OK', 'Fehler'),
      subtitle:
        api?.responseTimeMs != null && api.responseTimeMs > 0 ?
          `Antwortzeit ${api.responseTimeMs} ms`
        : 'Nicht verfügbar',
      icon: Code2,
      variant: statusVariant(api?.status),
    },
    {
      title: 'Datenbank',
      value: statusLabel(database?.status, 'OK', 'Fehler'),
      subtitle:
        database?.connections != null ?
          `Verbindungen ${database.connections}`
        : 'Nicht verfügbar',
      icon: Database,
      variant: statusVariant(database?.status),
    },
    {
      title: 'Mail',
      value: statusLabel(mail?.status, 'OK', 'Unbekannt'),
      subtitle:
        mail?.deliveryRate != null && mail.deliveryRate > 0 ?
          `Zustellung ${mail.deliveryRate.toLocaleString('de-DE')} %`
        : safeText((mail as { message?: string } | undefined)?.message, 'Nicht verfügbar'),
      icon: Mail,
      variant: statusVariant(mail?.status),
    },
    {
      title: 'Zahlungen',
      value: payments?.status === 'warning' ? 'Warnung' : statusLabel(payments?.status, 'OK', 'Fehler'),
      subtitle:
        payments?.openCases != null && payments.openCases > 0 ?
          `${payments.openCases} offene Fälle`
        : safeText((payments as { message?: string } | undefined)?.message, 'Nicht verfügbar'),
      icon: CreditCard,
      variant: statusVariant(payments?.status),
    },
    {
      title: 'Backups',
      value: statusLabel(backups?.status, 'OK', 'Fehler'),
      subtitle:
        backups?.lastBackupAt ?
          `Letztes: ${formatTime(backups.lastBackupAt)}`
        : 'Backup-System nicht konfiguriert',
      icon: Cloud,
      variant: statusVariant(backups?.status),
    },
    {
      title: 'Speicher',
      value:
        storage?.usedPercent != null && storage.usedPercent > 0 ?
          `${storage.usedPercent} %`
        : 'Nicht verfügbar',
      subtitle:
        storage?.usedGb != null && storage?.totalGb != null ?
          `${storage.usedGb} GB / ${storage.totalGb} GB`
        : 'Nicht verfügbar',
      icon: HardDrive,
      variant: 'cyan' as const,
      ringPercent: storage?.usedPercent ?? 0,
      showSparkline: false,
    },
    {
      title: 'Uptime',
      value: uptimeDisplayValue(health),
      subtitle: uptimeDisplaySubtitle(health),
      icon: Clock,
      variant: 'ok' as const,
      barData: [40, 65, 55, 80, 70, 90, 75, 85],
      showSparkline: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:grid-cols-8">
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
