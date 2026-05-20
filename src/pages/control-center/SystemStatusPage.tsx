import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useControlCenter } from '../../context/ControlCenterContext';
import { PageHeader } from '../../components/control-center/PageHeader';
import { SystemStatusCards } from '../../components/control-center/SystemStatusCards';
import { SystemInfoPanel } from '../../components/control-center/SystemInfoPanel';
import { formatDateTime } from '../../utils/format';
import type { HealthConnectivityInfo } from '../../types';

function ConnectivitySection({
  title,
  probe,
}: {
  title: string;
  probe: HealthConnectivityInfo | undefined;
}) {
  if (!probe) return null;
  return (
    <div className="glass-card p-4 text-xs">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <dl className="space-y-1.5 text-slate-400">
        <div className="flex justify-between gap-2">
          <dt>URL</dt>
          <dd className="max-w-[65%] truncate text-right text-slate-200">{probe.url ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Status</dt>
          <dd className="text-slate-200">{probe.message}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Letzter Check</dt>
          <dd className="text-slate-200">
            {probe.checkedAt ? formatDateTime(probe.checkedAt) : '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Antwortzeit</dt>
          <dd className="text-slate-200">
            {probe.responseTimeMs != null ? `${probe.responseTimeMs} ms` : '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>HTTP Status</dt>
          <dd className="text-slate-200">{probe.httpStatus ?? '—'}</dd>
        </div>
        {probe.technicalDetail ?
          <div className="flex justify-between gap-2">
            <dt>Fehler (technisch)</dt>
            <dd className="max-w-[65%] break-words text-right text-orange-200/90">
              {probe.technicalDetail}
            </dd>
          </div>
        : null}
        {probe.railwayHint ?
          <div className="mt-2 rounded border border-neon-orange/30 bg-neon-orange/5 p-2 text-orange-100">
            {probe.railwayHint}
          </div>
        : null}
        {title.includes('Server') ?
          <div className="flex justify-between gap-2">
            <dt>Admin-Health verfügbar</dt>
            <dd className="text-slate-200">{probe.adminHealthAvailable ? 'Ja' : 'Nein'}</dd>
          </div>
        : null}
      </dl>
    </div>
  );
}

export function SystemStatusPage() {
  const { data, isLive, isDegraded, loading, refreshing, refresh, meta, technicalError, loadError } =
    useControlCenter();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const health = data?.health;
  const showHealth = Boolean(health) && !loading;

  return (
    <>
      <PageHeader
        title="Systemstatus"
        subtitle="Technische Überwachung der RabbitStation Haupt-App (Frontend & Server/API getrennt)"
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
      {isDegraded && !health && !loading ?
        <div className="glass-card space-y-2 p-4 text-sm text-orange-100">
          <p className="font-medium text-neon-orange">
            {loadError ?? 'Statusdaten konnten nicht vollständig geladen werden.'}
          </p>
          {technicalError ?
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer text-neon-cyan">Technische Details</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">{technicalError}</pre>
            </details>
          : null}
        </div>
      : <SystemStatusCards
          health={showHealth ? health! : null}
          backups={data?.backups ?? null}
          loading={loading}
          unavailable={!showHealth}
        />
      }
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ConnectivitySection title="A) Frontend / Client" probe={health?.frontend} />
        <ConnectivitySection title="B) Server / API" probe={health?.serverApi} />
      </div>
      {isLive && health ?
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass-card p-4 text-xs">
            <h3 className="mb-2 text-sm font-semibold text-white">C) Datenbank</h3>
            <dl className="space-y-1.5 text-slate-400">
              <div className="flex justify-between gap-2">
                <dt>Status</dt>
                <dd className="text-slate-200">{health.database?.status ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Verbindungen</dt>
                <dd className="text-slate-200">{health.database?.connections ?? '—'}</dd>
              </div>
            </dl>
          </div>
          <div className="glass-card p-4 text-xs">
            <h3 className="mb-2 text-sm font-semibold text-white">D) Mail</h3>
            <dl className="space-y-1.5 text-slate-400">
              <div className="flex justify-between gap-2">
                <dt>Status</dt>
                <dd className="text-slate-200">{health.mail?.status ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Konfiguration</dt>
                <dd className="text-slate-200">
                  {health.mail?.configured ? 'Konfiguriert' : 'Nicht konfiguriert'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Meldung</dt>
                <dd className="max-w-[60%] text-right text-slate-200">{health.mail?.message ?? '—'}</dd>
              </div>
            </dl>
          </div>
          <div className="glass-card p-4 text-xs lg:col-span-2">
            <h3 className="mb-2 text-sm font-semibold text-white">E) Backups</h3>
            <dl className="grid gap-2 sm:grid-cols-2 text-slate-400">
              <div className="flex justify-between gap-2">
                <dt>Status</dt>
                <dd className="text-slate-200">{health.backups?.status ?? data?.backups?.lastBackupStatus ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Letztes Backup</dt>
                <dd className="text-slate-200">
                  {data?.backups?.lastBackupAt ? formatDateTime(data.backups.lastBackupAt) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2 sm:col-span-2">
                <dt>Meldung</dt>
                <dd className="text-slate-200">{data?.backups?.message ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </div>
      : null}
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
        <SystemInfoPanel info={data?.systemInfo ?? null} unavailable={!data?.systemInfo && !loading} />
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
