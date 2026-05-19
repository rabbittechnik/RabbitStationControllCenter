import { motion } from 'framer-motion';
import type { SubscriptionSummary } from '../../types';
import { formatCurrency } from '../../utils/format';
import { safeText } from '../../utils/safeDisplay';

interface SubscriptionRevenueCardsProps {
  data: SubscriptionSummary | null;
  unavailable?: boolean;
  loading?: boolean;
}

export function SubscriptionRevenueCards({ data, unavailable, loading }: SubscriptionRevenueCardsProps) {
  if (unavailable) {
    return (
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">Abos &amp; Umsatz</h3>
          <p className="text-xs text-slate-500">Live-Daten der Haupt-App</p>
        </div>
        <p className="glass-card p-4 text-sm text-slate-500">Noch keine Abo-Daten verfügbar</p>
      </div>
    );
  }

  if (!data || loading) {
    return (
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">Abos &amp; Umsatz</h3>
        </div>
        <SkeletonGrid />
      </div>
    );
  }

  const hasRevenue = (data.monthlyRevenue ?? 0) > 0;
  const revenueTrend = hasRevenue ?
    (data.monthlyRevenueTrend ?? '–')
  : 'Noch keine Zahlungsdaten verfügbar';

  const cards = [
    { title: 'Aktive Tenants', value: String(data.activeTenants ?? 0), trend: data.activeTenantsTrend ?? '–' },
    { title: 'Aktive Testphasen', value: String(data.activeTrials ?? data.trials ?? 0), trend: data.trialsTrend ?? '–' },
    {
      title: 'Heute ablaufende Trials',
      value: String(data.trialsExpiringToday ?? 0),
      trend: 'Trial endet heute',
    },
    {
      title: 'Abgelaufene Trials',
      value: String(data.expiredTrials ?? 0),
      trend: 'Status expired / Trial beendet',
    },
    {
      title: 'Aktive Abos',
      value: String(data.activeSubscriptions ?? 0),
      trend: data.activeSubscriptionsTrend ?? '–',
    },
    { title: 'Starter-Kunden', value: String(data.starterCustomers ?? 0), trend: 'Plan Starter' },
    { title: 'Pro-Kunden', value: String(data.proCustomers ?? 0), trend: 'Plan Pro' },
    {
      title: 'Multi-Station-Kunden',
      value: String(data.multiStationCustomers ?? 0),
      trend: 'Plan Multi-Station',
    },
    {
      title: 'Offene Zahlungen',
      value: String(data.openPayments ?? 0),
      trend: 'Status past_due',
      warn: (data.openPayments ?? 0) > 0,
    },
    {
      title: 'Monatsumsatz',
      value: hasRevenue ? formatCurrency(data.monthlyRevenue ?? 0) : '–',
      trend: revenueTrend,
      highlight: true,
    },
  ];

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">Abos &amp; Umsatz</h3>
        <p className="text-xs text-slate-500">Live-Daten der Haupt-App</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`glass-card p-3 ${card.highlight ? 'border-neon-cyan/25' : ''}`}
          >
            <p className="text-[10px] text-slate-500">{card.title}</p>
            <p
              className={`mt-1 text-lg font-semibold ${card.highlight ? 'text-neon-cyan' : 'text-white'}`}
            >
              {card.value}
            </p>
            <p
              className={`mt-1 text-[10px] leading-tight ${
                card.warn ? 'text-orange-400'
                : card.highlight && !hasRevenue ? 'text-slate-500'
                : 'text-neon-green'
              }`}
            >
              {safeText(card.trend)}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="glass-card h-20 animate-pulse" />
      ))}
    </div>
  );
}
