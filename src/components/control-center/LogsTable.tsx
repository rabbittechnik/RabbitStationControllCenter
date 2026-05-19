import type { SystemLog } from '../../types';
import { formatDateTime } from '../../utils/format';
import { LogAuditDetails } from './LogAuditDetails';
import { ResendWelcomeEmailAction } from './ResendWelcomeEmailAction';
import { showWelcomeEmailResendControl } from '../../utils/welcomeEmailLog';
import {
  filterLogs,
  type LogCategoryFilter,
  type LogSeverityFilter,
} from '../../utils/logFilters';

const severityClass: Record<string, string> = {
  success: 'text-neon-green',
  info: 'text-neon-cyan',
  warning: 'text-neon-orange',
  error: 'text-neon-red',
  critical: 'text-red-300 font-semibold',
};

interface LogsTableProps {
  logs: SystemLog[];
  severity: LogSeverityFilter;
  category: LogCategoryFilter;
  search: string;
  tenantId?: string | null;
  emptyMessage?: string;
  onLogsRefresh?: () => void | Promise<void>;
}

export function LogsTable({
  logs,
  severity,
  category,
  search,
  tenantId,
  emptyMessage,
  onLogsRefresh,
}: LogsTableProps) {
  const filtered = filterLogs(logs, { severity, category, search, tenantId });
  const showActionsColumn = filtered.some((l) => showWelcomeEmailResendControl(l));

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 bg-navy-900/50 text-slate-500">
              <th className="px-3 py-2 font-medium">Zeit</th>
              <th className="px-3 py-2 font-medium">Severity</th>
              <th className="px-3 py-2 font-medium">Aktion</th>
              <th className="px-3 py-2 font-medium">Tenant / Firma</th>
              <th className="px-3 py-2 font-medium">Station</th>
              <th className="px-3 py-2 font-medium">Benutzer</th>
              <th className="px-3 py-2 font-medium">Kategorie</th>
              {showActionsColumn ?
                <th className="px-3 py-2 font-medium">Aktionen</th>
              : null}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ?
              <tr>
                <td
                  colSpan={showActionsColumn ? 8 : 7}
                  className="px-3 py-10 text-center text-sm text-slate-500"
                >
                  {emptyMessage ?? 'Keine aktuellen Systemmeldungen.'}
                </td>
              </tr>
            : null}
            {filtered.map((log) => (
              <tr
                key={log.id}
                className="border-b border-white/5 hover:bg-white/[0.02]"
                title={
                  log.tenant_id ?
                    `Tenant-ID: ${log.tenant_id}${log.user_id ? ` · User: ${log.user_id}` : ''}`
                  : undefined
                }
              >
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-400">
                  {formatDateTime(log.created_at)}
                </td>
                <td className={`px-3 py-2.5 capitalize ${severityClass[log.severity] ?? 'text-slate-400'}`}>
                  {log.severity}
                </td>
                <td className="px-3 py-2.5 font-medium text-slate-200">
                  <div>{log.action_label ?? log.message}</div>
                  <LogAuditDetails log={log} />
                </td>
                <td className="px-3 py-2.5 text-slate-300">{log.tenant_name ?? log.headline ?? 'Plattform'}</td>
                <td className="px-3 py-2.5 text-slate-400">{log.station_name ?? log.tenant_slug ?? '–'}</td>
                <td className="max-w-[200px] truncate px-3 py-2.5 text-slate-400" title={log.user_email}>
                  {log.user_label ?? log.user_email ?? (log.user_id ? 'Unbekannter Benutzer' : '–')}
                </td>
                <td className="px-3 py-2.5 text-slate-500">{log.category}</td>
                {showActionsColumn ?
                  <td className="px-3 py-2.5">
                    <ResendWelcomeEmailAction log={log} onComplete={onLogsRefresh} compact />
                  </td>
                : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LogsFilterBar({
  severity,
  category,
  onSeverity,
  onCategory,
}: {
  severity: LogSeverityFilter;
  category: LogCategoryFilter;
  onSeverity: (v: LogSeverityFilter) => void;
  onCategory: (v: LogCategoryFilter) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      <select
        value={severity}
        onChange={(e) => onSeverity(e.target.value as LogSeverityFilter)}
        className="rounded border border-white/10 bg-navy-850 px-2 py-1.5 text-xs text-slate-300"
      >
        <option value="all">Alle Severity</option>
        <option value="info">Info</option>
        <option value="success">Erfolg</option>
        <option value="warning">Warnung</option>
        <option value="error">Fehler</option>
        <option value="critical">Kritisch</option>
      </select>
      <select
        value={category}
        onChange={(e) => onCategory(e.target.value as LogCategoryFilter)}
        className="rounded border border-white/10 bg-navy-850 px-2 py-1.5 text-xs text-slate-300"
      >
        <option value="all">Alle Kategorien</option>
        <option value="login">Login</option>
        <option value="registration">Registrierung</option>
        <option value="mail">Mail</option>
        <option value="tenant">Tenant</option>
        <option value="abo">Abo</option>
        <option value="backup">Backup</option>
        <option value="security">Sicherheit</option>
      </select>
    </div>
  );
}
