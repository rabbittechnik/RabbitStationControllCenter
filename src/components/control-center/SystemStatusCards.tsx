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
import type { HealthResponse } from '../../types';
import { formatTime } from '../../utils/format';

interface SystemStatusCardsProps {
  health: HealthResponse | null;
  loading?: boolean;
}

export function SystemStatusCards({ health, loading }: SystemStatusCardsProps) {
  if (loading || !health) {
    return (
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card h-24 animate-pulse p-4" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'App Online',
      value: health.app.status === 'ok' ? 'Online' : 'Offline',
      subtitle: health.app.message,
      icon: CheckCircle2,
      variant: health.app.status === 'ok' ? ('ok' as const) : ('error' as const),
      showPulse: true,
    },
    {
      title: 'API',
      value: health.api.status === 'ok' ? 'OK' : 'Fehler',
      subtitle: `Antwortzeit ${health.api.responseTimeMs} ms`,
      icon: Code2,
      variant: health.api.status === 'ok' ? ('ok' as const) : ('error' as const),
    },
    {
      title: 'Datenbank',
      value: health.database.status === 'ok' ? 'OK' : 'Fehler',
      subtitle: `Verbindungen ${health.database.connections}`,
      icon: Database,
      variant: health.database.status === 'ok' ? ('ok' as const) : ('error' as const),
    },
    {
      title: 'Mail',
      value: health.mail.status === 'ok' ? 'OK' : 'Unbekannt',
      subtitle:
        health.mail.deliveryRate > 0 ?
          `Zustellung ${health.mail.deliveryRate.toLocaleString('de-DE')} %`
        : 'Unbekannt',
      icon: Mail,
      variant: health.mail.status === 'ok' ? ('ok' as const) : ('warning' as const),
    },
    {
      title: 'Zahlungen',
      value: health.payments.status === 'warning' ? 'Warnung' : 'OK',
      subtitle: `${health.payments.openCases} offene Fälle`,
      icon: CreditCard,
      variant: health.payments.status === 'ok' ? ('ok' as const) : ('warning' as const),
    },
    {
      title: 'Backups',
      value: health.backups.status === 'ok' ? 'OK' : 'Fehler',
      subtitle: `Letztes: ${formatTime(health.backups.lastBackupAt)}`,
      icon: Cloud,
      variant: health.backups.status === 'ok' ? ('ok' as const) : ('error' as const),
    },
    {
      title: 'Speicher',
      value: `${health.storage.usedPercent} %`,
      subtitle: `${health.storage.usedGb} GB / ${health.storage.totalGb} GB`,
      icon: HardDrive,
      variant: 'cyan' as const,
      ringPercent: health.storage.usedPercent,
      showSparkline: false,
    },
    {
      title: 'Uptime',
      value: health.uptime.percent30Days > 0 ? `${health.uptime.percent30Days} %` : 'Unbekannt',
      subtitle: health.uptime.percent30Days > 0 ? 'Letzte 30 Tage' : 'Unbekannt',
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
