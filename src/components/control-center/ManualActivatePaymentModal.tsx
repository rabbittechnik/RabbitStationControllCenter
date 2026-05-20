import { useEffect, useState } from 'react';
import type { SubscriptionPlanId, Tenant, TenantSubscriptionPatch } from '../../types';
import { formatDateTime } from '../../utils/format';
import {
  paymentProviderLabel,
  requestedPlanLabel,
} from '../../utils/paymentDisplay';
import { PLAN_OPTIONS, planLabel } from '../../utils/tenantPlan';
import { AuditLogHint, inputClass, ModalField, ModalShell } from './ModalShell';

function addMonthIso(from = new Date()): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

interface ManualActivatePaymentModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onActivate: (patch: TenantSubscriptionPatch) => Promise<void>;
}

export function ManualActivatePaymentModal({
  tenant,
  open,
  onClose,
  onActivate,
}: ManualActivatePaymentModalProps) {
  const [plan, setPlan] = useState<SubscriptionPlanId>('pro');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant) return;
    const rp = (tenant.requested_plan ?? tenant.plan) as SubscriptionPlanId;
    setPlan(rp === 'starter' || rp === 'pro' || rp === 'multi_station' ? rp : 'pro');
    setReference('');
    setError(null);
  }, [tenant, open]);

  if (!tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = reference.trim();
    if (!ref) {
      setError('Bitte eine Notiz oder Zahlungsreferenz eingeben.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await onActivate({
        plan,
        subscription_status: 'active',
        payment_status: 'confirmed',
        payment_provider: 'sumup',
        payment_reference: ref,
        payment_confirmed_at: now,
        current_period_start: now,
        current_period_end: addMonthIso(),
        blocked_reason: null,
        note: ref,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Freischaltung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Abo manuell freischalten" open={open} onClose={onClose}>
      <dl className="mb-4 space-y-2 rounded-lg border border-white/10 bg-navy-900/50 p-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Kunde</dt>
          <dd className="text-right text-slate-200">{tenant.name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Station</dt>
          <dd className="text-right text-slate-200">{tenant.station_name ?? '–'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Betreiber</dt>
          <dd className="text-right text-slate-200">{tenant.operator ?? '–'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Gewünschter Plan</dt>
          <dd className="text-right text-neon-cyan">
            {requestedPlanLabel(tenant) ?? planLabel(tenant.plan)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Zahlungsanbieter</dt>
          <dd className="text-right text-slate-200">{paymentProviderLabel(tenant.payment_provider)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Zahlung gestartet</dt>
          <dd className="text-right text-slate-200">
            {tenant.payment_started_at ? formatDateTime(tenant.payment_started_at) : '–'}
          </dd>
        </div>
      </dl>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalField label="Plan auswählen">
          <select className={inputClass} value={plan} onChange={(e) => setPlan(e.target.value as SubscriptionPlanId)}>
            {PLAN_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.price})
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Notiz / Zahlungsreferenz" required>
          <textarea
            className={`${inputClass} min-h-[80px]`}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="z. B. SumUp-Zahlung geprüft am 20.05.2026"
            required
          />
        </ModalField>
        {error ?
          <p className="text-sm text-red-300">{error}</p>
        : null}
        <AuditLogHint action="subscription_manually_activated" />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-neon-green/90 px-4 py-2 text-sm font-semibold text-[#060b14] hover:bg-neon-green disabled:opacity-50"
          >
            {loading ? 'Speichern…' : 'Freischalten'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
