import { Building2, Crown, Gem } from 'lucide-react';
import type { Tenant } from '../../types';
import { activityLabel, formatTrialEnd } from '../../utils/format';
import { MiniSparkline } from './MiniSparkline';
import { TenantActionMenu } from './TenantActionMenu';

interface TenantOverviewTableProps {
  tenants: Tenant[];
  search: string;
  onSupport: (tenant: Tenant) => void;
  emptyMessage?: string;
}

function StatusBadge({ status }: { status: string }) {
  const isTrial = status === 'trial';
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
        isTrial
          ? 'bg-neon-orange/15 text-neon-orange'
          : 'bg-neon-green/15 text-neon-green'
      }`}
    >
      {isTrial ? 'Trial' : 'Aktiv'}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const isPro = plan.toLowerCase() === 'pro';
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-300">
      {isPro ? (
        <Crown className="h-3 w-3 text-neon-cyan" />
      ) : (
        <Gem className="h-3 w-3 text-slate-400" />
      )}
      {isPro ? 'Pro' : 'Basic'}
    </span>
  );
}

export function TenantOverviewTable({
  tenants,
  search,
  onSupport,
  emptyMessage,
}: TenantOverviewTableProps) {
  const filtered = search
    ? tenants.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tenants;

  return (
    <div className="glass-card overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Tenants Übersicht</h3>
        <button
          type="button"
          className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 hover:text-neon-cyan"
        >
          Alle Tenants
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-slate-500">
              <th className="pb-2 font-medium">Tenant</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Plan</th>
              <th className="pb-2 font-medium">Trial-Ende</th>
              <th className="pb-2 font-medium">Mitarbeiter</th>
              <th className="pb-2 font-medium">Letzte Aktivität</th>
              <th className="pb-2 font-medium"></th>
              <th className="pb-2 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ?
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-slate-500">
                  {emptyMessage ?? 'Keine Tenants gefunden.'}
                </td>
              </tr>
            : null}
            {filtered.map((tenant) => (
              <tr
                key={tenant.id}
                className="border-b border-white/5 transition hover:bg-white/[0.02]"
              >
                <td className="py-3">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <Building2 className="h-4 w-4 text-neon-cyan/70" />
                    {tenant.name}
                  </span>
                </td>
                <td className="py-3">
                  <StatusBadge status={tenant.status} />
                </td>
                <td className="py-3">
                  <PlanBadge plan={tenant.plan} />
                </td>
                <td className="py-3 text-slate-400">{formatTrialEnd(tenant.trial_end)}</td>
                <td className="py-3 text-slate-400">{tenant.employees}</td>
                <td className="py-3 text-slate-400">
                  {activityLabel(tenant.last_activity_minutes)}
                </td>
                <td className="py-3">
                  <MiniSparkline
                    color="#00e676"
                    data={[3, 5, 4, 7, 6, 8, 7, 9].map((v) => v + tenant.last_activity_minutes % 3)}
                  />
                </td>
                <td className="py-3">
                  <TenantActionMenu
                    tenant={tenant}
                    onSupport={onSupport}
                    onDetails={(t) => alert(`Details: ${t.name} (Demo)`)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
