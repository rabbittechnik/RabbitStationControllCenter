import type { SystemLog } from '../../types';
import { formatDateTime, formatTrialEnd } from '../../utils/format';
import { isTrialExtendedLogAction } from '../../utils/trialExtendLog';
import { isWelcomeEmailResendLogAction } from '../../utils/welcomeEmailLog';
import { planLabel } from '../../utils/tenantPlan';

export function LogAuditDetails({ log }: { log: SystemLog }) {
  const showWelcome = isWelcomeEmailResendLogAction(log.action);
  const showTrialExtend = isTrialExtendedLogAction(log.action);
  const tenantLine = log.tenant_name ?? log.headline ?? (log.tenant_id ? 'Unbekannter Tenant' : null);
  const stationLine = log.station_name ?? (showWelcome ? null : log.tenant_slug);
  const userLine = log.user_label ?? log.user_name ?? null;
  const emailLine = log.user_email ?? null;
  const hasDetails =
    showWelcome ||
    showTrialExtend ||
    tenantLine ||
    stationLine ||
    userLine ||
    emailLine ||
    log.error_message;

  if (!hasDetails) return null;

  return (
    <dl className="mt-1.5 space-y-0.5 text-[10px] text-slate-500">
      {tenantLine ? <DetailRow label="Firma/Tenant" value={tenantLine} /> : null}
      {showTrialExtend || showWelcome ?
        <DetailRow label="Station" value={log.station_name ?? '–'} />
      : stationLine ?
        <DetailRow label="Station" value={stationLine} />
      : null}
      {showTrialExtend && log.trial_extend_plan ?
        <DetailRow label="Plan" value={planLabel(log.trial_extend_plan)} />
      : null}
      {showTrialExtend ?
        <>
          <DetailRow label="Altes Trial-Ende" value={formatTrialEnd(log.trial_old_end ?? null)} />
          <DetailRow label="Neues Trial-Ende" value={formatTrialEnd(log.trial_new_end ?? null)} />
          {log.trial_days_added != null ?
            <DetailRow label="Tage" value={String(log.trial_days_added)} />
          : null}
        </>
      : null}
      {showTrialExtend && log.trial_extend_reason ?
        <DetailRow label="Grund" value={log.trial_extend_reason} />
      : null}
      {showTrialExtend && log.trial_extend_note ?
        <DetailRow label="Notiz" value={log.trial_extend_note} />
      : null}
      {showTrialExtend ?
        <DetailRow
          label="Ausgelöst durch"
          value={log.trial_extend_source === 'control_center' ? 'Control Center' : (log.trial_extend_source ?? '–')}
        />
      : null}
      {userLine ? <DetailRow label="Benutzer" value={userLine} /> : null}
      {emailLine ? <DetailRow label="E-Mail" value={emailLine} /> : null}
      {showWelcome || showTrialExtend ?
        <DetailRow label="Zeitpunkt" value={formatDateTime(log.created_at)} />
      : null}
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
