import { useControlCenter } from '../../context/ControlCenterContext';
import { SystemStatusCards } from '../../components/control-center/SystemStatusCards';
import { SystemHealthChart } from '../../components/control-center/SystemHealthChart';
import { LogsAndAlertsPanel } from '../../components/control-center/LogsAndAlertsPanel';
import { SubscriptionRevenueCards } from '../../components/control-center/SubscriptionRevenueCards';
import { TenantSubscriptionManager } from '../../components/control-center/TenantSubscriptionManager';
import { BackupSecurityPanel } from '../../components/control-center/BackupSecurityPanel';
import { SystemInfoPanel } from '../../components/control-center/SystemInfoPanel';
import { useNavigate } from 'react-router-dom';
import { CC_ROUTES } from '../../control-center/routes';
import { useState } from 'react';

export function OverviewPage() {
  const { data, isLive, loading, search, refresh, runBackupCheck, backupChecking, serverApiOnline } =
    useControlCenter();
  const showHealth = Boolean(data?.health) && !loading;
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState('all');

  const tenantEmpty =
    !serverApiOnline && !loading ?
      'Haupt-App API offline – Daten können aktuell nicht geladen werden.'
    : isLive && (data?.tenants?.length ?? 0) === 0 ? 'Keine Tenants gefunden.'
    : undefined;

  const logsEmpty =
    !serverApiOnline && !loading ?
      'Haupt-App-Logs können nicht geladen werden, weil die Server/API nicht erreichbar ist.'
    : isLive && (data?.logs?.length ?? 0) === 0 ? 'Keine aktuellen Systemmeldungen.'
    : undefined;

  return (
    <>
      <div className="mb-4">
        <SystemStatusCards
          health={showHealth ? (data?.health ?? null) : null}
          backups={data?.backups ?? null}
          loading={loading}
          unavailable={!showHealth}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <SubscriptionRevenueCards
            data={isLive ? (data?.subscriptions ?? null) : null}
            unavailable={!isLive && !loading}
            loading={loading && isLive}
          />
          <SystemHealthChart
            data={isLive ? (data?.charts ?? []) : []}
            period="24h"
            onPeriodChange={() => undefined}
            unavailable={!isLive && !loading}
          />
          <TenantSubscriptionManager
            tenants={isLive ? (data?.tenants ?? []) : []}
            search={search}
            disabled={!isLive}
            emptyMessage={tenantEmpty}
            onUpdated={refresh}
            onShowLogs={(tenantId) =>
              navigate(`${CC_ROUTES.logs}?tenant=${encodeURIComponent(tenantId)}`)
            }
          />
        </div>
        <div className="space-y-4">
          <LogsAndAlertsPanel
            logs={isLive ? (data?.logs ?? []) : []}
            severityFilter={severityFilter}
            onSeverityFilter={setSeverityFilter}
            emptyMessage={logsEmpty}
            onLogsRefresh={refresh}
          />
          <BackupSecurityPanel
            backups={isLive ? (data?.backups ?? null) : null}
            security={isLive ? (data?.security ?? null) : null}
            onRunBackupCheck={runBackupCheck}
            checking={backupChecking}
            unavailable={!isLive && !loading}
          />
          <SystemInfoPanel
            info={isLive ? (data?.systemInfo ?? null) : null}
            unavailable={!isLive && !loading}
          />
        </div>
      </div>
    </>
  );
}
