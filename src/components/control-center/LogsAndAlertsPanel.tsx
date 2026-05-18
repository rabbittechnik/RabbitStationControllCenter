import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import type { SystemLog } from '../../types';
import { formatTime } from '../../utils/format';

const severityConfig: Record<
  string,
  { icon: typeof Info; color: string; bg: string; border: string }
> = {
  warning: {
    icon: AlertTriangle,
    color: 'text-neon-orange',
    bg: 'bg-neon-orange/10',
    border: 'border-neon-orange/20',
  },
  error: {
    icon: XCircle,
    color: 'text-neon-red',
    bg: 'bg-neon-red/10',
    border: 'border-neon-red/20',
  },
  success: {
    icon: CheckCircle,
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    border: 'border-neon-green/20',
  },
  info: {
    icon: Info,
    color: 'text-neon-cyan',
    bg: 'bg-neon-cyan/10',
    border: 'border-neon-cyan/20',
  },
};

interface LogsAndAlertsPanelProps {
  logs: SystemLog[];
  severityFilter: string;
  onSeverityFilter: (s: string) => void;
  emptyMessage?: string;
}

function parseLogTitle(message: string): { title: string; text: string } {
  const parts = message.split(' – ');
  if (parts.length >= 2) return { title: parts[0], text: parts.slice(1).join(' – ') };
  return { title: message.slice(0, 40), text: message };
}

export function LogsAndAlertsPanel({
  logs,
  severityFilter,
  onSeverityFilter,
  emptyMessage,
}: LogsAndAlertsPanelProps) {
  const filtered =
    severityFilter === 'all' ? logs : logs.filter((l) => l.severity === severityFilter);

  return (
    <div className="glass-card flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Aktuelle Logs & Hinweise</h3>
        <button
          type="button"
          className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 hover:text-neon-cyan"
        >
          Alle Logs
        </button>
      </div>

      <select
        value={severityFilter}
        onChange={(e) => onSeverityFilter(e.target.value)}
        className="mb-3 rounded border border-white/10 bg-navy-850 px-2 py-1 text-xs text-slate-400"
      >
        <option value="all">Alle Severity</option>
        <option value="warning">Warnung</option>
        <option value="error">Fehler</option>
        <option value="success">Erfolg</option>
        <option value="info">Info</option>
      </select>

      <ul className="flex-1 space-y-2 overflow-y-auto">
        {filtered.length === 0 ?
          <li className="py-6 text-center text-xs text-slate-500">
            {emptyMessage ?? 'Keine aktuellen Meldungen.'}
          </li>
        : null}
        {filtered.map((log) => {
          const cfg = severityConfig[log.severity] ?? severityConfig.info;
          const Icon = cfg.icon;
          const { title, text } = parseLogTitle(log.message);
          return (
            <li
              key={log.id}
              className={`rounded-lg border p-2.5 ${cfg.bg} ${cfg.border} transition hover:brightness-110`}
            >
              <div className="flex gap-2">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium ${cfg.color}`}>{title}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{text}</p>
                  <p className="mt-1 text-[10px] text-slate-600">{formatTime(log.created_at)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="mt-3 text-left text-xs text-neon-cyan hover:underline"
      >
        Alle Aktivitäten anzeigen →
      </button>
    </div>
  );
}
