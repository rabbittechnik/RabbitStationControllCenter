import { useEffect, useState } from 'react';
import type { Tenant } from '../../types';
import { formatTrialEnd } from '../../utils/format';
import { dateInputToTrialEndIso } from '../../utils/trialExtend';
import { planLabel, toDateInputValue, trialDaysLabel } from '../../utils/tenantPlan';
import { inputClass, ModalField, ModalShell } from './ModalShell';

export type ExtendTrialPayload = {
  days?: number;
  newTrialEnd?: string;
  reason: string;
  note?: string;
};

interface ExtendTrialModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onExtend: (payload: ExtendTrialPayload) => Promise<{ newTrialEnd: string }>;
}

const PRESETS = [
  { label: '+3 Tage', days: 3 },
  { label: '+7 Tage', days: 7 },
  { label: '+14 Tage', days: 14 },
  { label: '+30 Tage', days: 30 },
] as const;

export function ExtendTrialModal({ tenant, open, onClose, onExtend }: ExtendTrialModalProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [selectedDays, setSelectedDays] = useState<number | null>(7);
  const [customDate, setCustomDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenant || !open) return;
    setStep('form');
    setSelectedDays(7);
    setUseCustomDate(false);
    setCustomDate(toDateInputValue(tenant.trial_end) || '');
    setReason('');
    setNote('');
    setError(null);
    setLoading(false);
  }, [tenant, open]);

  if (!tenant) return null;

  const buildPayload = (): ExtendTrialPayload | null => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Bitte geben Sie einen Grund für die Verlängerung an.');
      return null;
    }
    if (useCustomDate) {
      if (!customDate.trim()) {
        setError('Bitte wählen Sie ein gültiges Datum.');
        return null;
      }
      return {
        newTrialEnd: dateInputToTrialEndIso(customDate),
        reason: trimmedReason,
        note: note.trim() || undefined,
      };
    }
    if (selectedDays == null || selectedDays < 1 || selectedDays > 30) {
      setError('Bitte wählen Sie eine gültige Anzahl an Tagen.');
      return null;
    }
    return {
      days: selectedDays,
      reason: trimmedReason,
      note: note.trim() || undefined,
    };
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = buildPayload();
    if (!payload) return;
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setError(null);
    const payload = buildPayload();
    if (!payload) return;
    setLoading(true);
    try {
      await onExtend(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Testzeitraum konnte nicht verlängert werden.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const remainingLabel =
    tenant.status === 'expired' || (tenant.trial_days_left != null && tenant.trial_days_left <= 0)
      ? 'abgelaufen'
      : trialDaysLabel(tenant.trial_days_left, tenant.status === 'expired' ? 'trial' : tenant.status);

  return (
    <ModalShell title="Testzeitraum verlängern" open={open} onClose={onClose}>
      <div className="mb-4 space-y-1 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
        <InfoRow label="Kunde" value={tenant.name} />
        <InfoRow label="Station" value={tenant.station_name ?? tenant.slug ?? '–'} />
        <InfoRow label="Aktueller Plan" value={planLabel(tenant.plan)} />
        <InfoRow label="Aktuelles Trial-Ende" value={formatTrialEnd(tenant.trial_end)} />
        <InfoRow label="Resttage" value={remainingLabel} />
      </div>
      {step === 'form' ?
        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-400">Verlängerung wählen</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setUseCustomDate(false);
                    setSelectedDays(p.days);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm transition disabled:opacity-50 ${
                    !useCustomDate && selectedDays === p.days
                      ? 'border-neon-cyan/50 bg-neon-cyan/20 text-neon-cyan'
                      : 'border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <ModalField label="Eigenes Datum (optional)">
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setUseCustomDate(Boolean(e.target.value));
              }}
              className={inputClass}
            />
          </ModalField>
          <ModalField label="Grund der Verlängerung" required>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inputClass} min-h-[72px]`}
              placeholder="z. B. Kunde möchte nach Beratung noch mit dem Team testen"
              required
            />
          </ModalField>
          <ModalField label="Interne Notiz (optional)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${inputClass} min-h-[56px]`}
              placeholder="Interne Notiz"
            />
          </ModalField>
          {error ?
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          : null}
          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-neon-cyan/20 px-4 py-2 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-50"
            >
              Weiter zur Bestätigung
            </button>
          </div>
        </form>
      : <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Der Testzeitraum dieses Kunden wird verlängert. Der Kunde erhält dadurch wieder Zugriff
            entsprechend seines aktuellen Plans.
          </p>
          {error ?
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          : null}
          <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setStep('form')}
              disabled={loading}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="rounded-lg bg-neon-green/20 px-4 py-2 text-sm font-medium text-neon-green hover:bg-neon-green/30 disabled:opacity-50"
            >
              {loading ? 'Wird verlängert…' : 'Jetzt verlängern'}
            </button>
          </div>
        </div>
      }
    </ModalShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-36 shrink-0 text-slate-500">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}
