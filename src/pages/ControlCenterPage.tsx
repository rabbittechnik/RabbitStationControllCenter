import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import type { ChartPoint, OverviewData, Tenant } from '../types';
import { ControlCenterSidebar } from '../components/control-center/ControlCenterSidebar';
import { ControlCenterHeader } from '../components/control-center/ControlCenterHeader';
import { SystemStatusCards } from '../components/control-center/SystemStatusCards';
import { SystemHealthChart } from '../components/control-center/SystemHealthChart';
import { LogsAndAlertsPanel } from '../components/control-center/LogsAndAlertsPanel';
import { TenantOverviewTable } from '../components/control-center/TenantOverviewTable';
import { SubscriptionRevenueCards } from '../components/control-center/SubscriptionRevenueCards';
import { BackupSecurityPanel } from '../components/control-center/BackupSecurityPanel';
import { SystemInfoPanel } from '../components/control-center/SystemInfoPanel';
import { SupportAccessModal } from '../components/control-center/SupportAccessModal';

export function ControlCenterPage() {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [charts, setCharts] = useState<ChartPoint[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backupChecking, setBackupChecking] = useState(false);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [supportTenant, setSupportTenant] = useState<Tenant | null>(null);

  const loadOverview = useCallback(async () => {
    const overview = await api.getOverview();
    setData(overview);
    setCharts(overview.charts);
  }, []);

  const loadCharts = useCallback(async (period: '24h' | '7d' | '30d') => {
    const res = await api.getCharts(period);
    setCharts(res.data);
    setChartPeriod(period);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadOverview();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadOverview]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const health = await api.runHealthCheck();
      setData((prev) => (prev ? { ...prev, health } : prev));
      await loadOverview();
    } finally {
      setRefreshing(false);
    }
  };

  const handleBackupCheck = async () => {
    setBackupChecking(true);
    try {
      await api.runBackupCheck();
      await loadOverview();
    } finally {
      setBackupChecking(false);
    }
  };

  const handleSupportConfirm = async (reason: string) => {
    if (!supportTenant) return;
    await api.startSupportSession(supportTenant.id, reason);
    await loadOverview();
    setSupportTenant(null);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-navy-950">
      <div
        className={`${mobileSidebar ? 'fixed inset-y-0 left-0 z-40' : 'hidden'} lg:relative lg:block`}
      >
        <ControlCenterSidebar collapsed={sidebarCollapsed} />
      </div>
      {mobileSidebar && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ControlCenterHeader
          user={user}
          serverTime={data?.systemInfo.serverTime}
          overallStatus={data?.health.overallStatus}
          search={search}
          onSearchChange={setSearch}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onMenuClick={() => setMobileSidebar(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mb-4">
            <SystemStatusCards health={data?.health ?? null} loading={loading} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <SystemHealthChart
                data={charts}
                period={chartPeriod}
                onPeriodChange={(p) => loadCharts(p)}
              />
              <TenantOverviewTable
                tenants={data?.tenants ?? []}
                search={search}
                onSupport={setSupportTenant}
              />
              <SubscriptionRevenueCards data={data?.subscriptions ?? null} />
            </div>

            <div className="space-y-4">
              <LogsAndAlertsPanel
                logs={data?.logs ?? []}
                severityFilter={severityFilter}
                onSeverityFilter={setSeverityFilter}
              />
              <BackupSecurityPanel
                backups={data?.backups ?? null}
                security={data?.security ?? null}
                onRunBackupCheck={handleBackupCheck}
                checking={backupChecking}
              />
              <SystemInfoPanel info={data?.systemInfo ?? null} />
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
