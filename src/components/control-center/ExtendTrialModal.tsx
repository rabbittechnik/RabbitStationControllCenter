import { useEffect, useState } from 'react';
import type { Tenant, TenantSubscriptionPatch } from '../../types';
import { addDaysToIso, toDateInputValue } from '../../utils/tenantPlan';
import { AuditLogHint, inputClass, ModalField, ModalShell } from './ModalShell';

interface ExtendTrialModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onSave: (patch: TenantSubscriptionPatch) => Promise<void>;
}

const PRESETS = [
  { label: '+7 Tage', days: 7 },
  { label: '+14 Tage', days: 14 },
  { label: '+30 Tage', days: 30 },
] as const;

export function ExtendTrialModal({ tenant, open, onClose, onSave }: ExtendTrialModalProps) {
  const [customDate, setCustomDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setCustomDate(toDateInputValue(tenant.trial_end) || addDaysToIso(null, 14));
  }, [tenant, open]);

  if (!tenant) return null;

  const saveWithDate = async (date: string) => {
    setLoading(true);
    try {
      await onSave({
        subscription_status: 'trial',
        trial_end: date,
        note: 'Trial verlängert über Control Center',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) return;
    await saveWithDate(customDate);
  };

  return (
    <ModalShell title="Trial verlängern" open={open} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">
        Testphase für <strong className="text-neon-cyan">{tenant.name}</strong> verlängern.
      </p>
      <TrialPresets
        loading={loading}
        tenant={tenant}
        onPick={(days) => saveWithDate(addDaysToIso(tenant.trial_end, days))}
      />
      <form onSubmit={handleCustom} className="mt-4 space-y-4 border-t border-white/10 pt-4">
        <ModalField label="Eigenes Datum">
          <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className={inputClass} required />
        </ModalField>
        <AuditLogHint />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400">
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-neon-cyan/20 px-4 py-2 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-50"
          >
            {loading ? 'Speichern…' : 'Datum speichern'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function TrialPresets({
  loading,
  tenant,
  onPick,
}: {
  loading: boolean;
  tenant: Tenant;
  onPick: (days: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.days}
          type="button"
          disabled={loading}
          onClick={() => onPick(p.days)}
          className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-50"
        >
          {p.label}
        </button>
      ))}
      <p className="w-full text-xs text-slate-500">
        Aktuelles Trial-Ende: {toDateInputValue(tenant.trial_end) || 'nicht gesetzt'}
      </p>
    </div>
  );
}
