import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useControlCenter } from '../../context/ControlCenterContext';
import { PageHeader } from '../../components/control-center/PageHeader';
import { SystemStatusCards } from '../../components/control-center/SystemStatusCards';
import { SystemInfoPanel } from '../../components/control-center/SystemInfoPanel';
import { formatDateTime } from '../../utils/format';

export function SystemStatusPage() {
  const { data, isLive, loading, refreshing, refresh, meta } = useControlCenter();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const health = data?.health;

  return (
    <>
      <PageHeader
        title="Systemstatus"
        subtitle="Technische Überwachung der RabbitStation Haupt-App"
        actions={
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Jetzt prüfen
          </button>
        }
      />
      <SystemStatusCards
        health={isLive ? (health ?? null) : null}
        backups={isLive ? (data?.backups ?? null) : null}
        loading={loading}
        unavailable={!isLive && !loading}
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-4 text-xs">
          <h3 className="mb-2 text-sm font-semibold text-white">Prüfungen</h3>
          <dl className="space-y-1.5 text-slate-400">
            <div className="flex justify-between gap-2">
              <dt>Letzte Health-Prüfung</dt>
              <dd className="text-slate-200">
                {health?.checkedAt ? formatDateTime(health.checkedAt) : 'Nicht verfügbar'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Letzte Fehlermeldung</dt>
              <dd className="max-w-[60%] truncate text-right text-slate-200">
                {health?.errors?.[0] ?? meta?.lastError ?? 'Keine'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Warnungen</dt>
              <dd className="text-slate-200">
                {health?.warnings?.length ?
                  `${health.warnings.length} Hinweis(e)`
                : 'Keine'}
              </dd>
            </div>
          </dl>
        </div>
        <SystemInfoPanel
          info={isLive ? (data?.systemInfo ?? null) : null}
          unavailable={!isLive && !loading}
        />
      </div>
      <button
        type="button"
        onClick={() => setDetailsOpen(!detailsOpen)}
        className="mt-4 text-xs text-neon-cyan hover:underline"
      >
        {detailsOpen ? 'Technische Details ausblenden' : 'Technische Details anzeigen'}
      </button>
      {detailsOpen && health ?
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-white/10 bg-navy-900 p-3 text-[10px] text-slate-400">
          {JSON.stringify(health, null, 2)}
        </pre>
      : null}
    </>
  );
}
