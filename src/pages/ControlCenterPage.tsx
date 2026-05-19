import { useCallback, useEffect, useState } from 'react';
import { ApiRequestError, api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import type { ControlCenterMeta, OverviewData, Tenant } from '../types';
import { ControlCenterSidebar } from '../components/control-center/ControlCenterSidebar';
import { ControlCenterHeader } from '../components/control-center/ControlCenterHeader';
import { DataSourceBanner } from '../components/control-center/DataSourceBanner';
import { SystemStatusCards } from '../components/control-center/SystemStatusCards';
import { SystemHealthChart } from '../components/control-center/SystemHealthChart';
import { LogsAndAlertsPanel } from '../components/control-center/LogsAndAlertsPanel';
import { TenantOverviewTable } from '../components/control-center/TenantOverviewTable';
import { SubscriptionRevenueCards } from '../components/control-center/SubscriptionRevenueCards';
import { BackupSecurityPanel } from '../components/control-center/BackupSecurityPanel';
import { SystemInfoPanel } from '../components/control-center/SystemInfoPanel';
import { SupportAccessModal } from '../components/control-center/SupportAccessModal';

const AUTO_REFRESH_MS = 45_000;

function metaFromConfigStatus(cfg: {
  apiConfigured: boolean;
  apiUrlSet: boolean;
  tokenSet: boolean;
  error: string | null;
}): ControlCenterMeta {
  return {
    source: cfg.apiConfigured ? 'live' : 'error',
    apiConfigured: cfg.apiConfigured,
    apiUrlSet: cfg.apiUrlSet,
    tokenSet: cfg.tokenSet,
    message: cfg.error ?? undefined,
    lastError: cfg.error ?? undefined,
  };
}

export function ControlCenterPage() {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [meta, setMeta] = useState<ControlCenterMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backupChecking, setBackupChecking] = useState(false);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [supportTenant, setSupportTenant] = useState<Tenant | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isLive = meta?.source === 'live' && meta.apiConfigured;

  const loadAll = useCallback(async () => {
    setLoadError(null);
    const cfg = await api.getConfigStatus();
    if (!cfg.apiConfigured) {
      setMeta(metaFromConfigStatus(cfg));
      setData(null);
      return;
    }

    try {
      const overview = await api.getOverview();
      const { meta: m, ...rest } = overview;
      setMeta(m);
      setData(rest);
    } catch (e) {
      if (e instanceof ApiRequestError && e.meta) {
        setMeta(e.meta);
      } else {
        setMeta({
          source: 'error',
          apiConfigured: true,
          apiUrlSet: cfg.apiUrlSet,
          tokenSet: cfg.tokenSet,
          message: 'RabbitStation Haupt-App ist nicht verbunden.',
          lastError: e instanceof Error ? e.message : 'Unbekannter Fehler',
        });
      }
      setData(null);
      setLoadError(e instanceof Error ? e.message : 'Daten konnten nicht geladen werden.');
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadAll();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAll]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadAll().catch(() => undefined);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const handleBackupCheck = async () => {
    if (!isLive) return;
    setBackupChecking(true);
    try {
      const backups = await api.runBackupCheck();
      setData((prev) => (prev ? { ...prev, backups } : prev));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Backup-Status konnte nicht geladen werden.');
    } finally {
      setBackupChecking(false);
    }
  };

  const handleSupportConfirm = async (reason: string) => {
    if (!supportTenant || !isLive) return;
    await api.startSupportSession(supportTenant.id, reason);
    await loadAll();
    setSupportTenant(null);
  };

  if (!user) return null;

  const tenantEmpty =
    !isLive ? 'Tenants konnten nicht geladen werden.'
    : (data?.tenants?.length ?? 0) === 0 ? 'Keine Tenants gefunden.'
    : undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-navy-950">
      <div
        className={`${mobileSidebar ? 'fixed inset-y-0 left-0 z-40' : 'hidden'} lg:relative lg:block`}
      >
        <ControlCenterSidebar collapsed={sidebarCollapsed} />
      </div>
      {mobileSidebar ?
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      : null}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ControlCenterHeader
          user={user}
          serverTime={isLive ? data?.systemInfo.serverTime : undefined}
          overallStatus={isLive ? data?.health.overallStatus : undefined}
          search={search}
          onSearchChange={setSearch}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onMenuClick={() => setMobileSidebar(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <DataSourceBanner meta={meta} onRetry={handleRefresh} retrying={refreshing} />
          {loadError ?
            <div className="mb-4 rounded-lg border border-neon-red/40 bg-neon-red/10 px-4 py-3 text-sm text-red-200">
              {loadError}
            </div>
          : null}
          <div className="mb-4">
            <SystemStatusCards health={isLive ? (data?.health ?? null) : null} loading={loading} />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {isLive && (data?.charts?.length ?? 0) > 0 ?
                <SystemHealthChart
                  data={data!.charts}
                  period="24h"
                  onPeriodChange={() => undefined}
                />
              : !isLive && !loading ?
                <p className="glass-card p-4 text-sm text-slate-500">Systemgesundheit: Nicht verfügbar</p>
              : null}
              <TenantOverviewTable
                tenants={isLive ? (data?.tenants ?? []) : []}
                search={search}
                onSupport={setSupportTenant}
                emptyMessage={tenantEmpty}
              />
              <SubscriptionRevenueCards
                data={isLive ? (data?.subscriptions ?? null) : null}
                unavailable={!isLive && !loading}
              />
            </div>
            <div className="space-y-4">
              <LogsAndAlertsPanel
                logs={isLive ? (data?.logs ?? []) : []}
                severityFilter={severityFilter}
                onSeverityFilter={setSeverityFilter}
                emptyMessage={logsEmpty}
              />
              <BackupSecurityPanel
                backups={isLive ? (data?.backups ?? null) : null}
                security={isLive ? (data?.security ?? null) : null}
                onRunBackupCheck={handleBackupCheck}
                checking={backupChecking}
              />
              <SystemInfoPanel info={isLive ? (data?.systemInfo ?? null) : null} />
            </div>
          </div>
        </main>
      </div>
      <SupportAccessModal
        tenant={supportTenant}
        open={!!supportTenant}
        onClose={() => setSupportTenant(null)}
        onConfirm={handleSupportConfirm}
      />
    </div>
  );
}
