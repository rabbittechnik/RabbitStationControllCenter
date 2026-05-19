import { MiniSparkline } from './MiniSparkline';
import type { SystemInfo } from '../../types';
import { formatDateTime } from '../../utils/format';
import { safeText } from '../../utils/safeDisplay';

interface SystemInfoPanelProps {
  info: SystemInfo | null;
  unavailable?: boolean;
}

export function SystemInfoPanel({ info, unavailable }: SystemInfoPanelProps) {
  if (unavailable) {
    return (
      <div className="glass-card p-4">
        <h3 className="mb-2 text-sm font-semibold text-white">Systeminformationen</h3>
        <p className="text-xs text-slate-500">Status nicht verfügbar</p>
      </div>
    );
  }
  if (!info) return <div className="glass-card h-48 animate-pulse p-4" />;

  const rows = [
    { label: 'Umgebung', value: info.environment },
    { label: 'Region', value: info.region },
    { label: 'Version', value: `${info.version} (Build ${info.build})` },
    { label: 'Serverzeit', value: formatDateTime(info.serverTime) },
    { label: 'Laufzeit', value: info.uptime },
    {
      label: 'Systemlast',
      value: `${info.systemLoadPercent} %`,
      sparkline: true,
    },
    { label: 'Node', value: info.nodeVersion },
    { label: 'Datenbank', value: info.databaseVersion },
    { label: 'Letzter Deploy', value: formatDateTime(info.lastDeploy) },
    { label: 'Commit', value: info.commitHash },
  ];

  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Systeminformationen</h3>
      <dl className="space-y-2 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className="flex items-center gap-2 text-right text-slate-300">
              {safeText(row.value)}
              {row.sparkline && <MiniSparkline color="#00e676" data={[3, 5, 4, 6, 5, 7, 6]} />}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
