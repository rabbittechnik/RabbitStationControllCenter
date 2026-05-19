import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { SupportAccessMode, Tenant } from '../../types';

export type StartSupportForm = {
  tenantId: string;
  reason: string;
  accessMode: SupportAccessMode;
  durationMinutes: number;
};

interface StartSupportSessionModalProps {
  open: boolean;
  tenants: Tenant[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (form: StartSupportForm) => Promise<void>;
}

const DURATIONS = [
  { value: 30, label: '30 Minuten' },
  { value: 60, label: '60 Minuten' },
  { value: 120, label: '120 Minuten' },
  { value: 240, label: '240 Minuten' },
] as const;

export function StartSupportSessionModal({
  open,
  tenants,
  loading,
  onClose,
  onSubmit,
}: StartSupportSessionModalProps) {
  const [tenantId, setTenantId] = useState('');
  const [reason, setReason] = useState('Kunde meldet Fehler im Dienstplan');
  const [accessMode, setAccessMode] = useState<SupportAccessMode>('read_only');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (!tenantId && tenants.length > 0) {
      setTenantId(tenants[0].id);
    }
  }, [open, tenants, tenantId]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!tenantId) {
      setError('Bitte einen Tenant auswählen.');
      return;
    }
    if (!trimmed) {
      setError('Bitte einen Grund angeben.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ tenantId, reason: trimmed, accessMode, durationMinutes });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Support-Sitzung konnte nicht gestartet werden.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motionlessSupportModalOverlay>
      <div className="glass-card w-full max-w-lg p-6 shadow-glow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Support-Zugriff starten</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Zeitlich begrenzte Support-Sitzung für einen Kunden-Tenant. Der Zugriff wird protokolliert.
        </p>
        {tenants.length === 0 ?
          <p className="text-sm text-neon-orange">Keine Tenants verfügbar.</p>
        : <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Tenant auswählen</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white focus:border-neon-cyan/40 focus:outline-none"
                required
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Grund</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white focus:border-neon-cyan/40 focus:outline-none"
                required
              />
            </div>
            <div>
              <span className="mb-2 block text-xs text-slate-500">Zugriffsmodus</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm has-[:checked]:border-neon-cyan/50 has-[:checked]:bg-neon-cyan/10">
                  <input
                    type="radio"
                    name="accessMode"
                    checked={accessMode === 'read_only'}
                    onChange={() => setAccessMode('read_only')}
                  />
                  Nur lesen
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm has-[:checked]:border-neon-cyan/50 has-[:checked]:bg-neon-cyan/10">
                  <input
                    type="radio"
                    name="accessMode"
                    checked={accessMode === 'support_write'}
                    onChange={() => setAccessMode('support_write')}
                  />
                  Support mit Bearbeitung
                </label>
              </div>
            </div>
            <motionlessSupportDurationSelect
              durationMinutes={durationMinutes}
              onDurationChange={setDurationMinutes}
            />
            {error ?
              <p className="text-sm text-red-300">{error}</p>
            : null}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting || loading || tenants.length === 0}
                className="rounded-lg bg-neon-cyan/20 px-4 py-2 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-50"
              >
                {submitting ? 'Starte…' : 'Support starten'}
              </button>
            </div>
          </form>
        }
      </div>
    </motionlessSupportModalOverlay>
  );
}

function motionlessSupportModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      {children}
    </div>
  );
}

function motionlessSupportDurationSelect({
  durationMinutes,
  onDurationChange,
}: {
  durationMinutes: number;
  onDurationChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">Dauer</label>
      <select
        value={durationMinutes}
        onChange={(e) => onDurationChange(Number(e.target.value))}
        className="w-full rounded-lg border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white focus:border-neon-cyan/40 focus:outline-none"
      >
        {DURATIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
