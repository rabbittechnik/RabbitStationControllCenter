import type { ControlCenterMeta } from '../../types';

interface DataSourceBannerProps {
  meta: ControlCenterMeta | null;
  onRetry?: () => void;
  retrying?: boolean;
}

export function DataSourceBanner({ meta, onRetry, retrying }: DataSourceBannerProps) {
  if (!meta) return null;

  if (!meta.apiConfigured) {
    return (
      <div className="mb-4 rounded-lg border border-neon-red/40 bg-neon-red/10 px-4 py-3 text-sm text-neon-red">
        <p className="font-medium">Konfiguration unvollständig</p>
        <p className="mt-1 text-xs text-red-200/90">
          {meta.message ??
            'RABBITSTATION_API_URL und CONTROL_CENTER_API_TOKEN in Railway setzen.'}
        </p>
      </div>
    );
  }

  if (meta.source === 'demo') {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neon-orange/35 bg-neon-orange/10 px-4 py-3 text-sm">
        <div>
          <span className="mr-2 rounded bg-neon-orange/25 px-2 py-0.5 text-[10px] font-bold uppercase text-neon-orange">
            Demo-Modus
          </span>
          <span className="text-slate-300">
            {meta.lastError
              ? `Haupt-App nicht erreichbar: ${meta.lastError}`
              : meta.message ?? 'Lokale Demo-Daten werden angezeigt.'}
          </span>
        </div>
        {onRetry ?
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="rounded-lg border border-neon-cyan/40 px-3 py-1 text-xs text-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-50"
          >
            {retrying ? 'Lädt…' : 'Erneut prüfen'}
          </button>
        : null}
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-neon-green/30 bg-neon-green/5 px-4 py-2 text-xs text-neon-green">
      <span className="mr-2 font-semibold uppercase">Live</span>
      Daten aus RabbitStation Haupt-App
    </div>
  );
}
