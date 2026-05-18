import { motion } from 'framer-motion';
import type { SubscriptionSummary } from '../../types';
import { formatCurrency } from '../../utils/format';

interface SubscriptionRevenueCardsProps {
  data: SubscriptionSummary | null;
}

export function SubscriptionRevenueCards({ data }: SubscriptionRevenueCardsProps) {
  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Aktive Tenants',
      value: String(data.activeTenants),
      trend: data.activeTenantsTrend,
      positive: true,
    },
    {
      title: 'Testphasen',
      value: String(data.trials),
      trend: data.trialsTrend,
      positive: false,
    },
    {
      title: 'Aktive Abos',
      value: String(data.activeSubscriptions),
      trend: data.activeSubscriptionsTrend,
      positive: true,
    },
    {
      title: 'Monatsumsatz',
      value: formatCurrency(data.monthlyRevenue),
      trend: data.monthlyRevenueTrend,
      positive: true,
      highlight: true,
    },
  ];

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">Abos & Umsatz</h3>
        <p className="text-xs text-slate-500">aktueller Monat</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`glass-card p-4 ${card.highlight ? 'border-neon-cyan/25' : ''}`}
          >
            <p className="text-xs text-slate-500">{card.title}</p>
            <p
              className={`mt-1 text-xl font-semibold ${card.highlight ? 'text-neon-cyan' : 'text-white'}`}
            >
              {card.value}
            </p>
            <p
              className={`mt-1 text-[10px] ${card.positive ? 'text-neon-green' : 'text-neon-orange'}`}
            >
              {card.trend}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
