import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import type { ControlCenterMeta, OverviewData } from '../types';
import { normalizeOverviewData } from '../data/controlCenterDefaults';
import {
  ControlCenterSidebar,
  COMING_SOON_SECTIONS,
  type ControlCenterSection,
} from '../components/control-center/ControlCenterSidebar';
import { ControlCenterHeader } from '../components/control-center/ControlCenterHeader';
import { ComingSoonPanel } from '../components/control-center/ComingSoonPanel';
import { DataSourceBanner } from '../components/control-center/DataSourceBanner';
import { SystemStatusCards } from '../components/control-center/SystemStatusCards';
import { SystemHealthChart } from '../components/control-center/SystemHealthChart';
import { LogsAndAlertsPanel } from '../components/control-center/LogsAndAlertsPanel';
import { SubscriptionRevenueCards } from '../components/control-center/SubscriptionRevenueCards';
import { TenantSubscriptionManager } from '../components/control-center/TenantSubscriptionManager';
import { BackupSecurityPanel } from '../components/control-center/BackupSecurityPanel';
import { SystemInfoPanel } from '../components/control-center/SystemInfoPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';

const AUTO_REFRESH_MS = 45_000;

const SECTION_SCROLL_IDS: Partial<Record<ControlCenterSection, string>> = {
  system: 'cc-section-system',
  tenants: 'cc-section-tenants',
  subscriptions: 'cc-section-subscriptions',
  logs: 'cc-section-logs',
  backups: 'cc-section-backups',
};

const SECTION_LABELS: Record<ControlCenterSection, string> = {
  overview: 'Übersicht',
  system: 'Systemstatus',
  tenants: 'Tenants',
  subscriptions: 'Abos',
  logs: 'Logs',
  backups: 'Backups',
  security: 'Sicherheit',
  support: 'Support-Zugriffe',
  settings: 'Einstellungen',
};

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

function metaFromApiFail(
  cfg: { apiUrlSet: boolean; tokenSet: boolean },
  message: string,
  code?: string,
): ControlCenterMeta {
  return {
    source: 'error',
    apiConfigured: true,
    apiUrlSet: cfg.apiUrlSet,
    tokenSet: cfg.tokenSet,
    message: 'Haupt-App nicht verbunden',
    lastError: code ? `${message} (${code})` : message,
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [logsTenantFilter, setLogsTenantFilter] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ControlCenterSection>('overview');

  const isLive = meta?.source === 'live' && meta.apiConfigured;
  const showComingSoon = COMING_SOON_SECTIONS.includes(activeSection);

  const loadAll = useCallback(async () => {
    setLoadError(null);

    const cfgResult = await api.getConfigStatus();
    if (!cfgResult.ok) {
      setMeta({
        source: 'error',
        apiConfigured: false,
        apiUrlSet: false,
        tokenSet: false,
        message: cfgResult.message,
        lastError: cfgResult.message,
      });
      setData(null);
      return;
    }

    const cfg = cfgResult.data;
    if (!cfg.apiConfigured) {
      setMeta(metaFromConfigStatus(cfg));
      setData(null);
      return;
    }

    const overviewResult = await api.getOverview();
    if (!overviewResult.ok) {
      setMeta(metaFromApiFail(cfg, overviewResult.message, overviewResult.error));
      setData(null);
      setLoadError(overviewResult.message);
      return;
    }

    const overview = overviewResult.data;
    const { meta: m, ...rest } = overview;
    setMeta(m ?? metaFromConfigStatus({ ...cfg, apiConfigured: true, error: null }));
    setData(normalizeOverviewData(rest));
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadAll();
      } catch (e) {
        console.error('[ControlCenter] load failed', e);
        setLoadError(e instanceof Error ? e.message : 'Daten konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    })();
  }, [loadAll]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadAll().catch((e) => console.warn('[ControlCenter] refresh failed', e));
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [loadAll]);

  const handleNavigate = useCallback((section: ControlCenterSection) => {
    setActiveSection(section);
    setMobileSidebar(false);

    if (COMING_SOON_SECTIONS.includes(section)) return;

    const scrollId = SECTION_SCROLL_IDS[section];
    if (scrollId) {
      requestAnimationFrame(() => {
        document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (section === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

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
      console.error('[ControlCenter] backup check failed', e);
      setLoadError(e instanceof Error ? e.message : 'Backup-Status konnte nicht geladen werden.');
    } finally {
      setBackupChecking(false);
    }
  };

  if (!user) return null;

  const filteredLogs =
    logsTenantFilter && data?.logs ?
      data.logs.filter((l) => l.tenant_id === logsTenantFilter)
    : (data?.logs ?? []);

  const tenantEmpty =
    !isLive && !loading ? 'Tenants konnten nicht geladen werden.'
    : isLive && (data?.tenants?.length ?? 0) === 0 ? 'Keine Tenants gefunden.'
    : undefined;

  const logsEmpty =
    !isLive && !loading ? 'Logs konnten nicht geladen werden.'
    : isLive && (data?.logs?.length ?? 0) === 0 ? 'Keine aktuellen Systemmeldungen.'
    : undefined;

  const overallStatus = isLive ? (data?.health?.overallStatus ?? 'unknown') : 'unknown';
  const overallLabel = isLive ? data?.health?.overallLabel : undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-navy-950">
      <div
        className={`${mobileSidebar ? 'fixed inset-y-0 left-0 z-40' : 'hidden'} lg:relative lg:block`}
      >
        <ControlCenterSidebar
          collapsed={sidebarCollapsed}
          activeSection={activeSection}
          onNavigate={handleNavigate}
          apiConnected={isLive}
        />
      </div>
      {mobileSidebar ?
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebar(false)}
          aria-label="Menü schließen"
        />
      : null}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ControlCenterHeader
          user={user}
          serverTime={isLive ? data?.systemInfo?.serverTime : undefined}
          overallStatus={overallStatus}
          overallLabel={overallLabel}
          search={search}
          onSearchChange={setSearch}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onMenuClick={() => setMobileSidebar(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {loading ?
            <p className="mb-4 text-sm text-slate-400">Control-Center-Daten werden geladen…</p>
          : null}
          <DataSourceBanner meta={meta} onRetry={handleRefresh} retrying={refreshing} />
          {loadError ?
            <motionlessLoadError message={loadError} />
          : null}

          {showComingSoon ?
            <ComingSoonPanel sectionLabel={SECTION_LABELS[activeSection]} />
          : <ErrorBoundary compact>
              <motionlessDashboardContent
                isLive={isLive}
                loading={loading}
                data={data}
                search={search}
                tenantEmpty={tenantEmpty}
                filteredLogs={filteredLogs}
                logsEmpty={logsEmpty}
                severityFilter={severityFilter}
                onSeverityFilter={setSeverityFilter}
                logsTenantFilter={logsTenantFilter}
                onShowLogs={setLogsTenantFilter}
                onUpdated={loadAll}
                onBackupCheck={handleBackupCheck}
                backupChecking={backupChecking}
              />
            </ErrorBoundary>
          }
        </main>
      </div>
    </div>
  );
}

function motionlessLoadError({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg border border-neon-red/40 bg-neon-red/10 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  );
}

function motionlessDashboardContent({
  isLive,
  loading,
  data,
  search,
  tenantEmpty,
  filteredLogs,
  logsEmpty,
  severityFilter,
  onSeverityFilter,
  logsTenantFilter,
  onShowLogs,
  onUpdated,
  onBackupCheck,
  backupChecking,
}: {
  isLive: boolean;
  loading: boolean;
  data: OverviewData | null;
  search: string;
  tenantEmpty?: string;
  filteredLogs: OverviewData['logs'];
  logsEmpty?: string;
  severityFilter: string;
  onSeverityFilter: (s: string) => void;
  logsTenantFilter: string | null;
  onShowLogs: (id: string) => void;
  onUpdated: () => Promise<void>;
  onBackupCheck: () => void;
  backupChecking: boolean;
}) {
  return (
    <>
      <div className="mb-4">
        <SystemStatusCards
          health={isLive ? (data?.health ?? null) : null}
          backups={isLive ? (data?.backups ?? null) : null}
          loading={loading}
          unavailable={!isLive && !loading}
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
            onUpdated={onUpdated}
            onShowLogs={onShowLogs}
          />
        </div>
        <div className="space-y-4">
          <LogsAndAlertsPanel
            logs={isLive ? filteredLogs : []}
            severityFilter={severityFilter}
            onSeverityFilter={onSeverityFilter}
            emptyMessage={
              logsTenantFilter ? 'Keine Logs für diesen Tenant.' : logsEmpty
            }
          />
          <BackupSecurityPanel
            backups={isLive ? (data?.backups ?? null) : null}
            security={isLive ? (data?.security ?? null) : null}
            onRunBackupCheck={onBackupCheck}
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
