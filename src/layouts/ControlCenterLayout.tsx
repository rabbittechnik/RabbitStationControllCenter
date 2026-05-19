import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ControlCenterProvider, useControlCenter } from '../context/ControlCenterContext';
import { ControlCenterSidebar } from '../components/control-center/ControlCenterSidebar';
import { ControlCenterHeader } from '../components/control-center/ControlCenterHeader';
import { DataSourceBanner } from '../components/control-center/DataSourceBanner';
import { ConnectionAlert } from '../components/control-center/ConnectionAlert';
import { ErrorBoundary } from '../components/ErrorBoundary';

function LayoutInner() {
  const { user } = useAuth();
  const {
    data,
    meta,
    loading,
    refreshing,
    loadError,
    isLive,
    search,
    setSearch,
    refresh,
  } = useControlCenter();
  const [sidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  if (!user) return null;

  const overallStatus = isLive ? (data?.health?.overallStatus ?? 'unknown') : 'unknown';
  const overallLabel = isLive ? data?.health?.overallLabel : undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-navy-950">
      <motionlessSidebarSlot mobile={mobileSidebar}>
        <ControlCenterSidebar
          collapsed={sidebarCollapsed}
          apiConnected={isLive}
          onNavigate={() => setMobileSidebar(false)}
        />
      </motionlessSidebarSlot>
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
          onRefresh={refresh}
          refreshing={refreshing}
          onMenuClick={() => setMobileSidebar(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {loading ?
            <p className="mb-4 text-sm text-slate-400">Control-Center-Daten werden geladen…</p>
          : null}
          <DataSourceBanner meta={meta} onRetry={refresh} retrying={refreshing} />
          <ConnectionAlert />
          {loadError && !meta?.lastError?.includes('401') && meta?.source !== 'degraded' ?
            <div className="mb-4 rounded-lg border border-neon-red/40 bg-neon-red/10 px-4 py-3 text-sm text-red-200">
              {loadError}
            </div>
          : null}
          <ErrorBoundary compact>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function motionlessSidebarSlot({
  mobile,
  children,
}: {
  mobile: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${mobile ? 'fixed inset-y-0 left-0 z-40' : 'hidden'} lg:relative lg:block`}>
      {children}
    </div>
  );
}

export function ControlCenterLayout() {
  return (
    <ControlCenterProvider>
      <LayoutInner />
    </ControlCenterProvider>
  );
}
