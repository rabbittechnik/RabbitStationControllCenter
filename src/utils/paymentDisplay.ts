import type { Tenant } from '../types';
import { planLabel } from './tenantPlan';

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  none: 'Keine Zahlung',
  pending: 'Zahlung ausstehend',
  confirmed: 'Zahlung bestätigt',
  failed: 'Zahlung fehlgeschlagen',
  cancelled: 'Zahlung abgebrochen',
};

const PLAN_MONTHLY_EUR: Record<string, number> = {
  starter: 19.9,
  pro: 39.9,
  multi_station: 69.9,
};

export function paymentStatusLabel(status: string | null | undefined): string {
  const key = (status ?? 'none').trim().toLowerCase();
  return PAYMENT_STATUS_LABELS[key] ?? status ?? '–';
}

export function paymentProviderLabel(provider: string | null | undefined): string {
  const p = (provider ?? '').trim().toLowerCase();
  if (p === 'sumup') return 'SumUp';
  if (!p) return '–';
  return provider ?? '–';
}

export function isPaymentPending(tenant: Tenant): boolean {
  return (
    tenant.payment_status === 'pending' ||
    tenant.subscription_status === 'pending_payment' ||
    tenant.status === 'pending_payment'
  );
}

export function requestedPlanLabel(tenant: Tenant): string | null {
  const rp = tenant.requested_plan?.trim();
  if (!rp) return null;
  return planLabel(rp);
}

export function paymentBadgeClass(tenant: Tenant): string {
  if (tenant.payment_status === 'pending') return 'bg-amber-500/20 text-amber-300';
  if (tenant.payment_status === 'confirmed') return 'bg-neon-green/15 text-neon-green';
  if (tenant.payment_status === 'failed') return 'bg-neon-red/15 text-red-300';
  return 'bg-slate-500/20 text-slate-400';
}

export function estimateMonthlyRevenue(tenants: Tenant[]): number {
  return tenants
    .filter((t) => t.status === 'active' || t.subscription_status === 'active')
    .reduce((sum, t) => sum + (PLAN_MONTHLY_EUR[t.plan] ?? 0), 0);
}

export function countPendingPayments(tenants: Tenant[]): number {
  return tenants.filter(isPaymentPending).length;
}

export function countSumUpPending(tenants: Tenant[]): number {
  return tenants.filter(
    (t) => isPaymentPending(t) && (t.payment_provider ?? '').toLowerCase() === 'sumup',
  ).length;
}
