import type { Tenant } from '../../types';
import { formatTrialEnd } from '../../utils/format';
import { planLabel, statusLabel, trialDaysLabel } from '../../utils/tenantPlan';
import { ModalShell } from './ModalShell';

interface TenantDetailsModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
}

export function TenantDetailsModal({ tenant, open, onClose }: TenantDetailsModalProps) {
  if (!tenant) return null;

  const rows: [string, string][] = [
    ['Firma', tenant.name],
    ['Slug', tenant.slug ?? '–'],
    ['Betreiber', tenant.operator ?? '–'],
    ['Plan', planLabel(tenant.plan)],
    ['Status', statusLabel(tenant.status)],
    ['Trial-Ende', formatTrialEnd(tenant.trial_end)],
    ['Resttage', trialDaysLabel(tenant.trial_days_left)],
    ['Mitarbeiter (Benutzer)', String(tenant.employees)],
    ['Stationen', String(tenant.station_count)],
    ['Abrechnungszeitraum Start', tenant.current_period_start?.slice(0, 10) ?? '–'],
    ['Abrechnungszeitraum Ende', tenant.current_period_end?.slice(0, 10) ?? '–'],
    ['Sperrgrund', tenant.blocked_reason ?? '–'],
  ];

  return (
    <ModalShell title="Tenant-Details" open={open} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">Mandant {tenant.id}</p>
      <dl className="space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-white/5 py-2">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right text-slate-200">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400"
        >
          Schließen
        </button>
      </div>
    </ModalShell>
  );
}
