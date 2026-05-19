import type { SubscriptionPlanId, SubscriptionStatusId } from '../types';

export const PLAN_OPTIONS: { id: SubscriptionPlanId; label: string; price: string }[] = [
  { id: 'starter', label: 'Starter', price: '19,90 €' },
  { id: 'pro', label: 'Pro', price: '39,90 €' },
  { id: 'multi_station', label: 'Multi-Station', price: 'ab 69,90 €' },
];

export const STATUS_OPTIONS: { id: SubscriptionStatusId; label: string }[] = [
  { id: 'trial', label: 'Testphase' },
  { id: 'active', label: 'Aktiv' },
  { id: 'expired', label: 'Abgelaufen' },
  { id: 'past_due', label: 'Zahlung offen' },
  { id: 'cancelled', label: 'Gekündigt' },
  { id: 'blocked', label: 'Gesperrt' },
];

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  multi_station: 'Multi-Station',
};

const STATUS_LABELS: Record<string, string> = {
  trial: 'Testphase',
  active: 'Aktiv',
  expired: 'Abgelaufen',
  past_due: 'Zahlung offen',
  cancelled: 'Gekündigt',
  blocked: 'Gesperrt',
};

const STATUS_CLASSES: Record<string, string> = {
  trial: 'bg-cyan-500/15 text-cyan-300',
  active: 'bg-neon-green/15 text-neon-green',
  expired: 'bg-orange-500/15 text-orange-300',
  past_due: 'bg-orange-600/20 text-orange-400',
  cancelled: 'bg-slate-500/20 text-slate-400',
  blocked: 'bg-neon-red/15 text-red-300',
};

export function planLabel(plan: string): string {
  return PLAN_LABELS[plan] ?? plan;
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusBadgeClass(status: string): string {
  return STATUS_CLASSES[status] ?? 'bg-slate-500/20 text-slate-400';
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function addDaysToIso(dateIso: string | null | undefined, days: number): string {
  const base = dateIso ? new Date(dateIso) : new Date();
  if (Number.isNaN(base.getTime())) base.setTime(Date.now());
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function trialDaysLabel(days: number | null): string {
  if (days == null) return '–';
  if (days <= 0) return '0 Tage';
  return `${days} Tage`;
}
