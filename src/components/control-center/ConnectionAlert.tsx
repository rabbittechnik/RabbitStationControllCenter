import { useControlCenter } from '../../context/ControlCenterContext';

export function ConnectionAlert() {
  const { loading, isLive, isDegraded, loadError, meta } = useControlCenter();

  if (loading) return null;

  if (isDegraded && meta) {
    return (
      <div className="mb-4 rounded-lg border border-neon-orange/40 bg-neon-orange/10 px-4 py-3 text-sm text-orange-100">
        {meta.message ?? 'Haupt-App verbunden, einzelne Statusdaten nicht vollständig verfügbar'}
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

  if (!isLive && meta) {
    return (
      <div className="mb-4 rounded-lg border border-neon-orange/40 bg-neon-orange/10 px-4 py-3 text-sm text-orange-100">
        RabbitStation Haupt-App nicht erreichbar
      </div>
    );
  }

  return null;
}
