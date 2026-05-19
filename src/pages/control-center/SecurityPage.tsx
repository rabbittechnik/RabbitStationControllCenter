import { useMemo, useState } from 'react';
import { useControlCenter } from '../../context/ControlCenterContext';
import { PageHeader } from '../../components/control-center/PageHeader';
import { LogsTable, LogsFilterBar } from '../../components/control-center/LogsTable';
import type { LogCategoryFilter, LogSeverityFilter } from '../../utils/logFilters';

export function SecurityPage() {
  const { data, isLive, loading, search } = useControlCenter();
  const security = data?.security;
  const [severity, setSeverity] = useState<LogSeverityFilter>('all');
  const [category, setCategory] = useState<LogCategoryFilter>('security');

  const securityLogs = useMemo(() => {
    const logs = isLive ? (data?.logs ?? []) : [];
    return logs.filter((l) => {
      const a = l.action.toLowerCase();
      return (
        a.includes('login') ||
        a.includes('block') ||
        a.includes('role') ||
        a.includes('support') ||
        a.includes('denied') ||
        a.includes('password') ||
        a.includes('registration')
      );
    });
  }, [data?.logs, isLive]);

  const hasEvents =
    (security?.failedLogins24h ?? 0) > 0 ||
    (security?.blockedTenants ?? 0) > 0 ||
    securityLogs.length > 0;

  return (
    <>
      <PageHeader title="Sicherheit" subtitle="Sicherheitsübersicht und relevante Ereignisse" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Fehlgeschlagene Logins (24h)" value={security?.failedLogins24h ?? 0} warn />
        <StatCard label="Support-Sitzungen aktiv" value={security?.activeSupportSessions ?? 0} />
        <StatCard label="Rollenänderungen (24h)" value={security?.roleChanges24h ?? 0} />
        <StatCard label="Gesperrte Tenants" value={security?.blockedTenants ?? 0} warn />
        <StatCard
          label="Verdächtige API-Anfragen"
          value={security?.suspiciousApiRequests ?? 0}
          hint="API-Erweiterung empfohlen"
        />
        <StatCard label="Gesperrte Benutzer" value={security?.lockedUsers ?? 0} />
      </div>
      {!hasEvents && isLive && !loading ?
        <p className="mb-4 text-sm text-slate-500">Keine Sicherheitsereignisse vorhanden</p>
      : null}
      <h3 className="mb-2 text-sm font-semibold text-white">Sicherheitsrelevante Logs</h3>
      <LogsFilterBar
        severity={severity}
        category={category}
        onSeverity={setSeverity}
        onCategory={setCategory}
      />
      <LogsTable
        logs={securityLogs}
        severity={severity}
        category={category}
        search={search}
        emptyMessage={
          !isLive && !loading ? 'Keine Daten vorhanden' : 'Keine Sicherheitsereignisse vorhanden'
        }
      />
    </>
  );
}

function StatCard({
  label,
  value,
  warn,
  hint,
}: {
  label: string;
  value: number;
  warn?: boolean;
  hint?: string;
}) {
  return (
    <div className="glass-card p-3">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${warn && value > 0 ? 'text-neon-orange' : 'text-white'}`}>
        {value}
      </p>
      {hint ?
        <p className="mt-1 text-[9px] text-slate-600">{hint}</p>
      : null}
    </div>
  );
}
