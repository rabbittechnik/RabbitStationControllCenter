import { Building2 } from 'lucide-react';
import type { Tenant } from '../../types';
import { formatTrialEnd } from '../../utils/format';
import { planLabel, statusBadgeClass, statusLabel, trialDaysLabel } from '../../utils/tenantPlan';
import { TenantActionMenu, type TenantAction } from './TenantActionMenu';

interface AbosTableProps {
  tenants: Tenant[];
  search: string;
  disabled?: boolean;
  emptyMessage?: string;
  onAction: (action: TenantAction, tenant: Tenant) => void;
}

export function AbosTable({
  tenants,
  search,
  disabled,
  emptyMessage,
  onAction,
}: AbosTableProps) {
  const list = Array.isArray(tenants) ? tenants : [];
  const filtered = search
    ? list.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.operator ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (t.slug ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : list;

  return (
    <div className="glass-card overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Abo-Übersicht</h3>
        <span className="text-[10px] text-slate-500">{filtered.length} Einträge</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-slate-500">
              <th className="pb-2 font-medium">Tenant</th>
              <th className="pb-2 font-medium">Plan</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Trial-Ende</th>
              <th className="pb-2 font-medium">Abrechnungszeitraum</th>
              <th className="pb-2 font-medium">Zahlung</th>
              <th className="pb-2 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ?
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  {emptyMessage ?? 'Keine Daten vorhanden'}
                </td>
              </tr>
            : null}
            {filtered.map((tenant) => (
              <tr key={tenant.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-3">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <Building2 className="h-4 w-4 text-neon-cyan/70" />
                    {tenant.name}
                  </span>
                </td>
                <td className="py-3 text-slate-300">{planLabel(tenant.plan)}</td>
                <td className="py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(tenant.status)}`}
                  >
                    {statusLabel(tenant.status)}
                  </span>
                </td>
                <td className="py-3 text-slate-400">
                  {formatTrialEnd(tenant.trial_end)}
                  <span className="ml-1 text-slate-600">
                    ({trialDaysLabel(tenant.trial_days_left, tenant.status)})
                  </span>
                </td>
                <td className="py-3 text-slate-400">
                  {tenant.current_period_start && tenant.current_period_end ?
                    `${formatTrialEnd(tenant.current_period_start)} – ${formatTrialEnd(tenant.current_period_end)}`
                  : '–'}
                </td>
                <td className="py-3 text-slate-400">
                  {tenant.status === 'past_due' ? 'Offen' : '–'}
                </td>
                <td className="py-3">
                  <TenantActionMenu tenant={tenant} disabled={disabled} onAction={onAction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
