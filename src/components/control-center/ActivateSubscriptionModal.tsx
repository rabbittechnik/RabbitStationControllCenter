import { useEffect, useState } from 'react';
import type { Tenant, TenantSubscriptionPatch } from '../../types';
import { PLAN_OPTIONS, addDaysToIso, toDateInputValue } from '../../utils/tenantPlan';
import { AuditLogHint, inputClass, ModalField, ModalShell } from './ModalShell';

interface ActivateSubscriptionModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onSave: (patch: TenantSubscriptionPatch) => Promise<void>;
}

export function ActivateSubscriptionModal({
  tenant,
  open,
  onClose,
  onSave,
}: ActivateSubscriptionModalProps) {
  const [plan, setPlan] = useState('pro');
  const [startDate, setStartDate] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    const today = new Date().toISOString().slice(0, 10);
    setPlan(tenant.plan === 'starter' ? 'pro' : tenant.plan);
    setStartDate(toDateInputValue(tenant.current_period_start) || today);
    setPeriodEnd(toDateInputValue(tenant.current_period_end) || addDaysToIso(today, 30));
    setNote('');
  }, [tenant, open]);

  if (!tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        plan,
        subscription_status: 'active',
        current_period_start: startDate,
        current_period_end: periodEnd,
        blocked_reason: null,
        note: note.trim() || 'Abo aktiviert über Control Center',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Abo aktivieren" open={open} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">
        Abo für <strong className="text-neon-cyan">{tenant.name}</strong> aktivieren.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalField label="Plan">
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
            {PLAN_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} – {p.price}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Startdatum">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
        </ModalField>
        <ModalField label="Ende aktueller Zeitraum">
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputClass} required />
        </ModalField>
        <ModalField label="Notiz">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputClass} />
        </ModalField>
        <AuditLogHint />
        <ModalActions loading={loading} onClose={onClose} label="Abo aktivieren" />
      </form>
    </ModalShell>
  );
}

function ModalActions({
  loading,
  onClose,
  label,
}: {
  loading: boolean;
  onClose: () => void;
  label: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400">
        Abbrechen
      </button>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-neon-green/20 px-4 py-2 text-sm font-medium text-neon-green hover:bg-neon-green/30 disabled:opacity-50"
      >
        {loading ? 'Speichern…' : label}
      </button>
    </div>
  );
}
