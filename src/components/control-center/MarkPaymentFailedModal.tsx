import { useEffect, useState } from 'react';
import type { Tenant, TenantSubscriptionPatch } from '../../types';
import { paymentProviderLabel, requestedPlanLabel } from '../../utils/paymentDisplay';
import { AuditLogHint, inputClass, ModalField, ModalShell } from './ModalShell';

interface MarkPaymentFailedModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (patch: TenantSubscriptionPatch) => Promise<void>;
}

export function MarkPaymentFailedModal({
  tenant,
  open,
  onClose,
  onConfirm,
}: MarkPaymentFailedModalProps) {
  const [reason, setReason] = useState('SumUp-Zahlung nicht gefunden');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReason('SumUp-Zahlung nicht gefunden');
    setError(null);
  }, [tenant, open]);

  if (!tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const blocked = reason.trim();
    if (!blocked) {
      setError('Bitte einen Grund angeben.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm({
        payment_status: 'failed',
        subscription_status: 'past_due',
        blocked_reason: blocked,
        note: blocked,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell title="Zahlung fehlgeschlagen markieren" open={open} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-400">
        Kunde: <span className="text-slate-200">{tenant.name}</span>
        {requestedPlanLabel(tenant) ?
          <> · Gewünscht: <span className="text-neon-cyan">{requestedPlanLabel(tenant)}</span></>
        : null}
        {tenant.payment_provider ?
          <> · {paymentProviderLabel(tenant.payment_provider)}</>
        : null}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ModalField label="Grund / Notiz" required>
          <textarea
            className={`${inputClass} min-h-[72px]`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </ModalField>
        {error ?
          <p className="text-sm text-red-300">{error}</p>
        : null}
        <AuditLogHint action="payment_failed" />
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
            className="rounded-lg bg-neon-red/80 px-4 py-2 text-sm font-semibold text-white hover:bg-neon-red disabled:opacity-50"
          >
            {loading ? 'Speichern…' : 'Als fehlgeschlagen markieren'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
