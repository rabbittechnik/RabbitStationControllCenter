import { useEffect, useState } from 'react';
import type { Tenant, TenantSubscriptionPatch } from '../../types';
import { PLAN_OPTIONS, STATUS_OPTIONS, toDateInputValue } from '../../utils/tenantPlan';
import { AuditLogHint, inputClass, ModalField, ModalShell } from './ModalShell';

interface ChangePlanModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onSave: (patch: TenantSubscriptionPatch) => Promise<void>;
}

export function ChangePlanModal({ tenant, open, onClose, onSave }: ChangePlanModalProps) {
  const [plan, setPlan] = useState('starter');
  const [status, setStatus] = useState('trial');
  const [trialEnd, setTrialEnd] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setPlan(tenant.plan);
    setStatus(tenant.status);
    setTrialEnd(toDateInputValue(tenant.trial_end));
    setPeriodStart(toDateInputValue(tenant.current_period_start));
    setPeriodEnd(toDateInputValue(tenant.current_period_end));
    setNote('');
  }, [tenant, open]);

  if (!tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const patch: TenantSubscriptionPatch = {
        plan,
        subscription_status: status,
        note: note.trim() || undefined,
      };
      if (trialEnd) patch.trial_end = trialEnd;
      if (periodStart) patch.current_period_start = periodStart;
      if (periodEnd) patch.current_period_end = periodEnd;
      if (status === 'blocked' && note.trim()) {
        patch.blocked_reason = note.trim();
      }
      await onSave(patch);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Plan ändern" open={open} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">
        Abo für <strong className="text-neon-cyan">{tenant.name}</strong> anpassen.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalField label="Plan auswählen">
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
            {PLAN_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} – {p.price}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Status auswählen">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Trial-Ende (optional)">
          <input type="date" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} className={inputClass} />
        </ModalField>
        <ModalField label="Aktueller Abrechnungszeitraum – Start (optional)">
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inputClass} />
        </ModalField>
        <ModalField label="Aktueller Abrechnungszeitraum – Ende (optional)">
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputClass} />
        </ModalField>
        <ModalField label="Notiz / Grund">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Grund für die Änderung"
          />
        </ModalField>
        <AuditLogHint />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400">
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-neon-cyan/20 px-4 py-2 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-50"
          >
            {loading ? 'Speichern…' : 'Änderung speichern'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
