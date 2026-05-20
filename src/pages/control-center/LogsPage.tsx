import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useControlCenter } from '../../context/ControlCenterContext';
import { PageHeader } from '../../components/control-center/PageHeader';
import { LogsFilterBar, LogsTable } from '../../components/control-center/LogsTable';
import type { LogCategoryFilter, LogSeverityFilter } from '../../utils/logFilters';

export function LogsPage() {
  const { data, isLive, loading, search, refresh, serverApiOnline } = useControlCenter();
  const [params] = useSearchParams();
  const tenantId = params.get('tenant');
  const [severity, setSeverity] = useState<LogSeverityFilter>('all');
  const [category, setCategory] = useState<LogCategoryFilter>('all');

  const logs = useMemo(() => (isLive ? (data?.logs ?? []) : []), [data?.logs, isLive]);

  const empty =
    !serverApiOnline && !loading ?
      'Haupt-App-Logs können nicht geladen werden, weil die Server/API nicht erreichbar ist.'
    : logs.length === 0 ? 'Keine aktuellen Systemmeldungen.'
    : tenantId ? 'Keine Logs für diesen Tenant.'
    : undefined;

  return (
    <>
      <PageHeader
        title="Logs"
        subtitle="System-, Audit- und Ereignisprotokolle"
      />
      {tenantId ?
        <p className="mb-3 text-xs text-neon-cyan">Filter: Tenant ausgewählt</p>
      : null}
      <LogsFilterBar
        severity={severity}
        category={category}
        onSeverity={setSeverity}
        onCategory={setCategory}
      />
      <LogsTable
        logs={logs}
        severity={severity}
        category={category}
        search={search}
        tenantId={tenantId}
        emptyMessage={empty}
        onLogsRefresh={refresh}
      />
    </>
  );
}
