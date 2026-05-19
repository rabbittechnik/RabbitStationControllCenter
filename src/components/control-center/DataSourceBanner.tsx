import type { ControlCenterMeta } from '../../types';

interface DataSourceBannerProps {
  meta: ControlCenterMeta | null;
  onRetry?: () => void;
  retrying?: boolean;
}

function envLabel(set?: boolean) {
  return set ? 'gesetzt' : 'fehlt';
}

export function DataSourceBanner({ meta, onRetry, retrying }: DataSourceBannerProps) {
  if (!meta) return null;

  if (meta.source === 'live' && meta.apiConfigured) {
    return (
      <div className="mb-4 rounded-lg border border-neon-green/30 bg-neon-green/5 px-4 py-2 text-xs text-neon-green">
        <span className="mr-2 font-semibold uppercase">Live</span>
        Daten aus RabbitStation Haupt-App
      </div>
    );
  }

  if (meta.source === 'degraded' && meta.apiConfigured) {
    return (
      <div className="mb-4 rounded-lg border border-neon-orange/40 bg-neon-orange/10 px-4 py-3 text-sm text-orange-100">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-neon-orange">
              {meta.message ?? 'Haupt-App verbunden, einzelne Statusdaten nicht vollständig verfügbar'}
            </p>
            {meta.lastError ?
              <p className="mt-1 text-xs text-orange-200/80">Details: {meta.lastError}</p>
            : null}
          </div>
          {onRetry ?
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="shrink-0 rounded-lg border border-neon-cyan/40 px-3 py-1.5 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-50"
            >
              {retrying ? 'Lädt…' : 'Erneut prüfen'}
            </button>
          : null}
        </div>
      </div>
    );
  }

  const title = !meta.apiConfigured ? 'Konfiguration unvollständig' : 'Haupt-App nicht verbunden';

  const body =
    !meta.apiConfigured ?
      'Das Control Center konnte keine echten Daten aus der RabbitStation Haupt-App laden.'
    : meta.message ??
      'Das Control Center konnte keine echten Daten aus der RabbitStation Haupt-App laden.';

  return (
    <div className="mb-4 rounded-lg border border-neon-red/40 bg-neon-red/10 px-4 py-3 text-sm text-red-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-neon-red">{title}</p>
          <p className="mt-1 text-xs text-red-200/90">{body}</p>
          <ul className="mt-3 space-y-1 font-mono text-[11px] text-red-200/80">
            <li>RABBITSTATION_API_URL: {envLabel(meta.apiUrlSet)}</li>
            <li>CONTROL_CENTER_API_TOKEN: {envLabel(meta.tokenSet)}</li>
            {meta.lastError ?
              <li className="break-words">Letzter Fehler: {meta.lastError}</li>
            : null}
          </ul>
        </div>
        {onRetry ?
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="shrink-0 rounded-lg border border-neon-cyan/40 px-3 py-1.5 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-50"
          >
            {retrying ? 'Lädt…' : 'Erneut prüfen'}
          </button>
        : null}
      </div>
    </div>
  );
}
