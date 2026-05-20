import { motion } from 'framer-motion';
import type { SubscriptionSummary } from '../../types';
import { formatCurrency } from '../../utils/format';
import { safeText } from '../../utils/safeDisplay';

interface SubscriptionRevenueCardsProps {
  data: SubscriptionSummary | null;
  unavailable?: boolean;
  loading?: boolean;
  apiOffline?: boolean;
}

type CardItem = {
  title: string;
  value: string;
  trend: string;
  warn?: boolean;
  highlight?: boolean;
};

export function SubscriptionRevenueCards({
  data,
  unavailable,
  loading,
  apiOffline,
}: SubscriptionRevenueCardsProps) {
  if (apiOffline && !loading) {
    return (
      <div id="cc-section-subscriptions">
        <SectionHeader />
        <p className="glass-card p-4 text-sm text-orange-200">Haupt-App nicht erreichbar.</p>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div id="cc-section-subscriptions">
        <SectionHeader />
        <p className="glass-card p-4 text-sm text-slate-500">Noch keine Abo-Daten verfügbar</p>
      </div>
    );
  }

  if (!data || loading) {
    return <SubscriptionSkeleton />;
  }

  const hasRevenue = (data.monthlyRevenue ?? 0) > 0;
  const pending = data.pendingPayments ?? 0;
  const active = data.activeSubscriptions ?? 0;

  const cards: CardItem[] = [
    {
      title: 'Zahlungen ausstehend',
      value: String(pending),
      trend: pending > 0 ? 'Manuell zu prüfen' : 'Keine offenen SumUp-Zahlungen.',
      warn: pending > 0,
    },
    {
      title: 'SumUp gestartet',
      value: String(data.sumupPaymentsStarted ?? pending),
      trend: 'Zahlungsanbieter SumUp',
      warn: (data.sumupPaymentsStarted ?? 0) > 0,
    },
    {
      title: 'Manuell zu prüfen',
      value: String(data.manualReviewCount ?? pending),
      trend: 'Freischaltung im Control Center',
      warn: (data.manualReviewCount ?? 0) > 0,
    },
    {
      title: 'Aktive Abos',
      value: String(active),
      trend: active > 0 ? data.activeSubscriptionsTrend ?? '–' : 'Keine aktiven Abos.',
      highlight: active > 0,
    },
    {
      title: 'Abgelaufene Testphasen',
      value: String(data.expiredTrials ?? 0),
      trend: 'Status expired / Trial beendet',
    },
    {
      title: 'Monatsumsatz geschätzt',
      value: hasRevenue ? formatCurrency(data.monthlyRevenue ?? 0) : '–',
      trend: data.monthlyRevenueTrend ?? '–',
      highlight: true,
    },
    {
      title: 'Aktive Tenants',
      value: String(data.activeTenants ?? 0),
      trend: data.activeTenantsTrend ?? '–',
    },
    {
      title: 'Aktive Testphasen',
      value: String(data.activeTrials ?? data.trials ?? 0),
      trend: data.trialsTrend ?? '–',
    },
  ];

  return (
    <div id="cc-section-subscriptions">
      <SectionHeader />
      <CardsGrid cards={cards} hasRevenue={hasRevenue} />
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-white">Abos &amp; Zahlungen</h3>
      <p className="text-xs text-slate-500">SumUp-Zahlungen und manuelle Freischaltung</p>
    </div>
  );
}

function CardsGrid({ cards, hasRevenue }: { cards: CardItem[]; hasRevenue: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
  );
}

function SubscriptionSkeleton() {
  return (
    <div id="cc-section-subscriptions">
      <SectionHeader />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card h-20 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
