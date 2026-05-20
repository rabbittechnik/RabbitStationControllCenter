import { useControlCenter } from '../../context/ControlCenterContext';

export function ConnectionAlert() {
  const { loading, isLive, isDegraded, loadError, meta } = useControlCenter();

  if (loading) return null;

  const banner = meta?.connectivityBanner?.trim();

  if (banner && meta?.serverApiOnline === false) {
    return (
      <div className="mb-4 rounded-lg border border-neon-red/40 bg-neon-red/10 px-4 py-3 text-sm text-red-200">
        {banner}
      </div>
    );
  }

  if (isDegraded && meta) {
    return (
      <div className="mb-4 rounded-lg border border-neon-orange/40 bg-neon-orange/10 px-4 py-3 text-sm text-orange-100">
        {meta.message ?? 'Server/API verbunden, einzelne Statusdaten nicht vollständig verfügbar'}
      </div>
    );
  }

  if (loadError) {
    const auth =
      meta?.lastError?.includes('401') ||
      meta?.lastError?.includes('403') ||
      meta?.lastError?.toLowerCase().includes('token') ||
      meta?.lastError?.toLowerCase().includes('verweigert');
    return (
      <div className="mb-4 rounded-lg border border-neon-red/40 bg-neon-red/10 px-4 py-3 text-sm text-red-200">
        {auth ? 'Keine Berechtigung oder Token ungültig' : loadError}
      </div>
    );
  }

  if (!isLive && meta && meta.serverApiOnline === false && !banner) {
    return (
      <div className="mb-4 rounded-lg border border-neon-orange/40 bg-neon-orange/10 px-4 py-3 text-sm text-orange-100">
        RabbitStation Haupt-App Server/API nicht erreichbar
      </div>
    );
  }

  return null;
}
