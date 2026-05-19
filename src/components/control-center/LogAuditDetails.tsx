import type { SystemLog } from '../../types';
import { formatDateTime } from '../../utils/format';
import { isWelcomeEmailResendLogAction } from '../../utils/welcomeEmailLog';

export function LogAuditDetails({ log }: { log: SystemLog }) {
  const showExtended = isWelcomeEmailResendLogAction(log.action);
  const tenantLine = log.tenant_name ?? log.headline ?? (log.tenant_id ? 'Unbekannter Tenant' : null);
  const stationLine = log.station_name ?? (showExtended ? null : log.tenant_slug);
  const userLine = log.user_label ?? log.user_name ?? null;
  const emailLine = log.user_email ?? null;
  const hasDetails =
    showExtended || tenantLine || stationLine || userLine || emailLine || log.error_message;

  if (!hasDetails) return null;

  return (
    <dl className="mt-1.5 space-y-0.5 text-[10px] text-slate-500">
      {tenantLine ? <DetailRow label="Tenant/Firma" value={tenantLine} /> : null}
      {showExtended ?
        <DetailRow label="Station" value={log.station_name ?? '–'} />
      : stationLine ?
        <DetailRow label="Station" value={stationLine} />
      : null}
      {userLine ? <DetailRow label="Benutzer" value={userLine} /> : null}
      {emailLine ? <DetailRow label="E-Mail" value={emailLine} /> : null}
      {showExtended ? <DetailRow label="Zeitpunkt" value={formatDateTime(log.created_at)} /> : null}
      {log.error_message ?
        <div className="flex gap-1">
          <dt className="shrink-0 text-slate-600">Fehler:</dt>
          <dd className="text-neon-red/90">{log.error_message}</dd>
        </div>
      : null}
    </dl>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <dt className="shrink-0 text-slate-600">{label}:</dt>
      <dd className="truncate text-slate-400">{value}</dd>
    </div>
  );
}
