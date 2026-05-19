import type { SystemInfo, SystemInfoBlock } from '../../types';
import { formatDateTime } from '../../utils/format';
import { safeText } from '../../utils/safeDisplay';

interface SystemInfoPanelProps {
  info: SystemInfo | null;
  unavailable?: boolean;
}

function InfoBlock({ block, fallbackUptime }: { block: SystemInfoBlock; fallbackUptime?: string }) {
  const rows = [
    { label: 'Umgebung', value: block.environment },
    { label: 'Version', value: block.version },
    { label: 'Build', value: block.build },
    { label: 'Node', value: block.nodeVersion },
    { label: 'Region', value: block.region },
    { label: 'Datenbank', value: block.databaseVersion },
    { label: 'Letzter Deploy', value: block.lastDeploy ? formatDateTime(block.lastDeploy) : undefined },
    { label: 'Laufzeit', value: block.uptime ?? fallbackUptime },
    { label: 'Serverzeit', value: block.serverTime ? formatDateTime(block.serverTime) : undefined },
    {
      label: 'Verbindung',
      value:
        block.apiConnected === true ? 'Verbunden'
        : block.apiConnected === false ? 'Nicht verbunden'
        : undefined,
    },
  ].filter((r) => r.value != null && String(r.value).trim() !== '');

  return (
    <div className="rounded-lg border border-white/5 bg-navy-900/40 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neon-cyan/90">
        {block.label}
      </h4>
      {rows.length === 0 ?
        <p className="text-xs text-slate-500">Nicht verfügbar</p>
      : <dl className="space-y-1.5 text-xs">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-2">
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="text-right text-slate-300">{safeText(row.value)}</dd>
            </div>
          ))}
        </dl>
      }
    </div>
  );
}

export function SystemInfoPanel({ info, unavailable }: SystemInfoPanelProps) {
  if (unavailable) {
    return (
      <motionlessSystemInfoUnavailable />
    );
  }
  if (!info) return <div className="glass-card h-48 animate-pulse p-4" />;

  const mainApp: SystemInfoBlock = info.mainApp ?? {
    label: 'RabbitStation Haupt-App',
    environment: info.environment,
    version: info.version,
    build: info.build,
    nodeVersion: info.nodeVersion,
    databaseVersion: info.databaseVersion,
    region: info.region,
    lastDeploy: info.lastDeploy,
    uptime: info.uptime,
    serverTime: info.serverTime,
  };

  const controlCenter: SystemInfoBlock = info.controlCenter ?? {
    label: 'RabbitStation Control Center',
    version: info.version,
    build: info.build,
    nodeVersion: info.nodeVersion,
    region: info.region,
    uptime: 'Nicht verfügbar',
    apiConnected: false,
  };

  return (
    <div id="cc-section-systeminfo" className="glass-card space-y-3 p-4">
      <h3 className="text-sm font-semibold text-white">Systeminformationen</h3>
      <InfoBlock block={mainApp} fallbackUptime={info.uptime} />
      <InfoBlock block={controlCenter} />
    </div>
  );
}

function motionlessSystemInfoUnavailable() {
  return (
    <div className="glass-card p-4">
      <h3 className="mb-2 text-sm font-semibold text-white">Systeminformationen</h3>
      <p className="text-xs text-slate-500">Haupt-App nicht erreichbar</p>
    </div>
  );
}
