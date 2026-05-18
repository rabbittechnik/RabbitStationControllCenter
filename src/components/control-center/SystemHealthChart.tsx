import {
  ComposedChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ChartPoint } from '../../types';

interface SystemHealthChartProps {
  data: ChartPoint[];
  period: string;
  onPeriodChange: (p: '24h' | '7d' | '30d') => void;
}

export function SystemHealthChart({ data, period, onPeriodChange }: SystemHealthChartProps) {
  const periods = [
    { id: '24h' as const, label: 'Letzte 24 Stunden' },
    { id: '7d' as const, label: 'Letzte 7 Tage' },
    { id: '30d' as const, label: 'Letzte 30 Tage' },
  ];

  return (
    <div className="glass-card flex flex-col p-4 lg:flex-row lg:gap-4">
      <div className="min-h-[260px] flex-1">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Systemgesundheit</h3>
            <p className="text-xs text-slate-500">letzte 24 Stunden</p>
          </div>
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as '24h' | '7d' | '30d')}
            className="rounded-lg border border-white/10 bg-navy-850 px-2 py-1 text-xs text-slate-300"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} width={36} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} width={28} />
            <Tooltip
              contentStyle={{
                background: '#0d1628',
                border: '1px solid rgba(0,229,255,0.2)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="responseTimeMs"
              name="Antwortzeit (ms)"
              stroke="#00e5ff"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="errorRate"
              name="Fehler (%)"
              stroke="#ff5252"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 w-full border-t border-white/5 pt-4 lg:mt-0 lg:w-48 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <h4 className="mb-2 text-xs font-semibold text-slate-300">Anfragen (stündlich)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <Bar dataKey="requests" fill="rgba(0, 229, 255, 0.5)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
