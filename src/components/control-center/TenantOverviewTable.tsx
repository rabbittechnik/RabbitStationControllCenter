import { Building2, Crown, Gem, Layers } from 'lucide-react';
import type { Tenant } from '../../types';
import { formatRelativeActivity, formatTrialEnd } from '../../utils/format';
import {
  isPaymentPending,
  paymentBadgeClass,
  paymentStatusLabel,
  requestedPlanLabel,
} from '../../utils/paymentDisplay';
import { planLabel, statusBadgeClass, statusLabel, trialDaysLabel } from '../../utils/tenantPlan';
import { TenantActionMenu, type TenantAction } from './TenantActionMenu';

interface TenantOverviewTableProps {
  tenants: Tenant[];
  search: string;
  disabled?: boolean;
  emptyMessage?: string;
  onDetails: (tenant: Tenant) => void;
  onChangePlan: (tenant: Tenant) => void;
  onExtendTrial: (tenant: Tenant) => void;
  onActivate: (tenant: Tenant) => void;
  onReleasePayment?: (tenant: Tenant) => void;
  onMarkPaymentFailed?: (tenant: Tenant) => void;
  onBlock: (tenant: Tenant) => void;
  onUnblock: (tenant: Tenant) => void;
  onSupport: (tenant: Tenant) => void;
  onShowLogs?: (tenant: Tenant) => void;
}

function PlanBadge({ plan }: { plan: string }) {
  const Icon =
    plan === 'pro' ? Crown
    : plan === 'multi_station' ? Layers
    : Gem;
  const iconClass =
    plan === 'pro' ? 'text-neon-cyan'
    : plan === 'multi_station' ? 'text-purple-300'
    : 'text-slate-400';

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-300">
      <Icon className={`h-3 w-3 ${iconClass}`} />
      {planLabel(plan)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

export function TenantOverviewTable({
  tenants,
  search,
  disabled,
  emptyMessage,
  onDetails,
  onChangePlan,
  onExtendTrial,
  onActivate,
  onReleasePayment,
  onMarkPaymentFailed,
  onBlock,
  onUnblock,
  onSupport,
  onShowLogs,
}: TenantOverviewTableProps) {
  const list = Array.isArray(tenants) ? tenants : [];
  const filtered = search
    ? list.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          (t.operator ?? '').toLowerCase().includes(search.toLowerCase()) ||
          (t.slug ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : list;

  const handleAction = (action: TenantAction, tenant: Tenant) => {
    switch (action) {
      case 'details':
      case 'openCustomer':
        onDetails(tenant);
        break;
      case 'changePlan':
        onChangePlan(tenant);
        break;
      case 'extendTrial':
        onExtendTrial(tenant);
        break;
      case 'activate':
        onActivate(tenant);
        break;
      case 'releaseSubscription':
        onReleasePayment?.(tenant);
        break;
      case 'markPaymentFailed':
        onMarkPaymentFailed?.(tenant);
        break;
      case 'keepPaymentOpen':
        break;
      case 'block':
        onBlock(tenant);
        break;
      case 'unblock':
        onUnblock(tenant);
        break;
      case 'logs':
        onShowLogs?.(tenant);
        break;
      case 'support':
        onSupport(tenant);
        break;
    }
  };

  return (
    <div id="cc-section-tenants" className="glass-card overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Tenants &amp; Abos</h3>
        <span className="text-[10px] text-slate-500">{filtered.length} Mandanten</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1320px] text-left text-xs">
          <thead>
            <tr className="border-b border-white/5 text-slate-500">
              <th className="pb-2 font-medium">Firma / Tenant</th>
              <th className="pb-2 font-medium">Station</th>
              <th className="pb-2 font-medium">Betreiber-E-Mail</th>
              <th className="pb-2 font-medium">Aktueller Plan</th>
              <th className="pb-2 font-medium">Gewünschter Plan</th>
              <th className="pb-2 font-medium">Zahlungsstatus</th>
              <th className="pb-2 font-medium">Abo-Status</th>
              <th className="pb-2 font-medium">Trial-Ende</th>
              <th className="pb-2 font-medium">Resttage</th>
              <th className="pb-2 font-medium">Mitarbeiter</th>
              <th className="pb-2 font-medium">Letzte Aktivität</th>
              <th className="pb-2 font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ?
              <tr>
                <td colSpan={12} className="py-8 text-center text-sm text-slate-500">
                  {emptyMessage ?? 'Keine Tenants gefunden.'}
                </td>
              </tr>
            : null}
            {filtered.map((tenant) => (
              <tr
                key={tenant.id}
                className={`border-b border-white/5 transition hover:bg-white/[0.02] ${
                  isPaymentPending(tenant) ? 'bg-amber-500/[0.03]' : ''
                }`}
              >
                <td className="py-3">
                  <span className="flex items-center gap-2 font-medium text-slate-200">
                    <Building2 className="h-4 w-4 shrink-0 text-neon-cyan/70" />
                    <span>
                      {tenant.name}
                      {tenant.slug ?
                        <span className="mt-0.5 block text-[10px] font-normal text-slate-500">
                          {tenant.slug}
                        </span>
                      : null}
                    </span>
                  </span>
                </td>
                <td className="py-3 text-slate-400">{tenant.station_name ?? tenant.slug ?? '–'}</td>
                <td className="max-w-[180px] truncate py-3 text-slate-400" title={tenant.operator}>
                  {tenant.operator ?? '–'}
                </td>
                <td className="py-3">
                  <PlanBadge plan={tenant.plan} />
                </td>
                <td className="py-3 text-slate-300">
                  {requestedPlanLabel(tenant) ?
                    <span className="text-neon-cyan">Gewünscht: {requestedPlanLabel(tenant)}</span>
                  : '–'}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClass(tenant)}`}
                  >
                    {paymentStatusLabel(tenant.payment_status)}
                  </span>
                </td>
                <td className="py-3">
                  <StatusBadge status={tenant.status} />
                </td>
                <td className="py-3 text-slate-400">{formatTrialEnd(tenant.trial_end)}</td>
                <td className="py-3 text-slate-400">
                  {trialDaysLabel(tenant.trial_days_left, tenant.status)}
                </td>
                <td className="py-3 text-slate-400">{tenant.employees}</td>
                <td className="py-3 text-slate-400">
                  {formatRelativeActivity(
                    tenant.last_activity_minutes,
                    tenant.last_activity_at,
                  )}
                </td>
                <td className="py-3">
                  <TenantActionMenu
                    tenant={tenant}
                    disabled={disabled}
                    onAction={handleAction}
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
