import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { safeText } from '../../utils/safeDisplay';
import { MiniSparkline } from './MiniSparkline';

export type StatusVariant = 'ok' | 'warning' | 'error' | 'cyan' | 'neutral';

const variantStyles: Record<
  StatusVariant,
  { value: string; glow: string; spark: string; border: string }
> = {
  ok: {
    value: 'text-neon-green',
    glow: 'shadow-glow-green',
    spark: '#00e676',
    border: 'border-neon-green/20',
  },
  warning: {
    value: 'text-neon-orange',
    glow: 'shadow-glow-orange',
    border: 'border-neon-orange/25',
  },
  error: {
    value: 'text-neon-red',
    glow: 'shadow-glow-red',
    border: 'border-neon-red/25',
  },
  cyan: {
    value: 'text-neon-cyan',
    glow: 'shadow-glow',
    spark: '#00e5ff',
    border: 'border-neon-cyan/20',
  },
  neutral: {
    value: 'text-slate-200',
    glow: '',
    spark: '#64748b',
    border: 'border-white/10',
  },
};

interface StatusCardProps {
  title: string;
  value: string | number;
  subtitle: string | number;
  icon: LucideIcon;
  variant?: StatusVariant;
  showPulse?: boolean;
  showSparkline?: boolean;
  ringPercent?: number;
  barData?: number[];
  index?: number;
}

export function StatusCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'ok',
  showPulse = false,
  showSparkline = true,
  ringPercent,
  barData,
  index = 0,
}: StatusCardProps) {
  const styles = variantStyles[variant];
  const valueText = safeText(value);
  const subtitleText = safeText(subtitle);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`glass-card flex min-w-[140px] flex-1 flex-col gap-2 p-4 ${styles.glow} ${styles.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {title}
        </span>
        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className={`flex items-center gap-2 text-lg font-semibold ${styles.value}`}>
            {showPulse && variant === 'ok' && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-green opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-green" />
              </span>
            )}
            {valueText}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{subtitleText}</p>
        </div>

        {ringPercent !== undefined && (
          <svg width="40" height="40" className="-rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="3"
              strokeDasharray={`${(ringPercent / 100) * 100.5} 100.5`}
              strokeLinecap="round"
            />
          </svg>
        )}

        {barData && (
          <div className="flex h-6 items-end gap-0.5">
            {barData.map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-sm bg-neon-green/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        )}

        {showSparkline && !ringPercent && !barData && (
          <MiniSparkline color={styles.spark} />
        )}
      </div>
    </motion.div>
  );
}
