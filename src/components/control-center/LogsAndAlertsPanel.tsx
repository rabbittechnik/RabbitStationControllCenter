import { AlertTriangle, Info, CheckCircle, XCircle, AlertOctagon } from 'lucide-react';
import type { SystemLog } from '../../types';
import { formatTime } from '../../utils/format';
import { LogAuditDetails } from './LogAuditDetails';
import { ResendWelcomeEmailAction } from './ResendWelcomeEmailAction';

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
  critical: {
    icon: AlertOctagon,
    color: 'text-red-300',
    bg: 'bg-red-500/15',
    border: 'border-red-400/30',
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
  onLogsRefresh?: () => void | Promise<void>;
}

export function LogsAndAlertsPanel({
  logs,
  severityFilter,
  onSeverityFilter,
  emptyMessage,
  onLogsRefresh,
}: LogsAndAlertsPanelProps) {
  const list = Array.isArray(logs) ? logs : [];
  const filtered =
    severityFilter === 'all' ? list : list.filter((l) => l.severity === severityFilter);

  return (
    <div id="cc-section-logs" className="glass-card flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Aktuelle Logs &amp; Hinweise</h3>
        <span className="text-[10px] text-slate-500">{list.length} Einträge</span>
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
        <option value="critical">Kritisch</option>
      </select>

      <ul className="flex-1 space-y-2 overflow-y-auto">
        {filtered.length === 0 ?
          <li className="py-6 text-center text-xs text-slate-500">
            {emptyMessage ?? 'Keine aktuellen Systemmeldungen.'}
          </li>
        : null}
        {filtered.map((log) => (
          <LogEntry key={log.id} log={log} onResendComplete={onLogsRefresh} />
        ))}
      </ul>
    </div>
  );
}

function LogEntry({
  log,
  onResendComplete,
}: {
  log: SystemLog;
  onResendComplete?: () => void | Promise<void>;
}) {
  const cfg = severityConfig[log.severity] ?? severityConfig.info;
  const Icon = cfg.icon;
  const title = log.action_label ?? log.message;
  const headline = log.headline ?? 'Plattform';
  const subline = log.subline ?? log.tenant_operator;
  const userLine = formatUserLine(log);

  return (
    <li
      className={`rounded-lg border p-2.5 ${cfg.bg} ${cfg.border} transition hover:brightness-110`}
      title={
        log.tenant_id ?
          `Tenant-ID: ${log.tenant_id}${log.user_id ? ` · User-ID: ${log.user_id}` : ''}`
        : undefined
      }
    >
      <div className="flex gap-2">
        <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cfg.color}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-snug text-slate-100">{headline}</p>
          {subline ?
            <p className="text-[10px] text-slate-400">{subline}</p>
          : null}
          {userLine ?
            <p className="text-[10px] text-slate-500">{userLine}</p>
          : null}
          <p className={`mt-1 text-xs font-medium ${cfg.color}`}>{title}</p>
          <LogAuditDetails log={log} />
          <p className="mt-1 text-[10px] text-slate-600">{formatTime(log.created_at)}</p>
          <ResendWelcomeEmailAction log={log} onComplete={onResendComplete} compact />
        </div>
      </div>
    </li>
  );
}

function formatUserLine(log: SystemLog): string | null {
  const parts: string[] = [];
  if (log.user_label && log.user_label !== 'Unbekannter Benutzer') {
    parts.push(log.user_label);
  } else if (log.user_name) {
    parts.push(log.user_name);
  }
  if (log.user_email && log.user_email !== log.user_label) {
    parts.push(log.user_email);
  }
  if (log.user_role) {
    parts.push(log.user_role);
  }
  if (parts.length > 0) return parts.join(' · ');
  if (log.user_id) return 'Unbekannter Benutzer';
  return null;
}
