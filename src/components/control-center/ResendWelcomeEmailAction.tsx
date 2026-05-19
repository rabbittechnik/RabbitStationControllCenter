import { useCallback, useState } from 'react';
import { Mail } from 'lucide-react';
import type { SystemLog } from '../../types';
import { api } from '../../api/client';
import { ModalShell } from './ModalShell';
import { showWelcomeEmailResendControl, welcomeEmailResendTarget } from '../../utils/welcomeEmailLog';

type Toast = { message: string; type: 'success' | 'error'; detail?: string };

interface ResendWelcomeEmailActionProps {
  log: SystemLog;
  onComplete?: () => void | Promise<void>;
  compact?: boolean;
}

export function ResendWelcomeEmailAction({
  log,
  onComplete,
  compact = false,
}: ResendWelcomeEmailActionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  if (!showWelcomeEmailResendControl(log)) return null;

  const { tenantId, userId, userEmail } = welcomeEmailResendTarget(log);
  const canResend = Boolean(log.can_resend_welcome && tenantId && userId);
  const disabledReason =
    log.resend_disabled_reason ?? 'Benutzer konnte nicht eindeutig zugeordnet werden.';
  const displayEmail = userEmail ?? 'den Benutzer';

  const runResend = useCallback(async () => {
    if (!tenantId || !userId) return;
    setSending(true);
    setToast(null);
    const result = await api.resendWelcomeEmail(tenantId, userId);
    setSending(false);
    setConfirmOpen(false);

    if (!result.ok) {
      setToast({
        type: 'error',
        message: 'Willkommens-E-Mail konnte nicht gesendet werden.',
        detail: result.message,
      });
      await onComplete?.();
      return;
    }

    setToast({
      type: 'success',
      message: result.data.message ?? 'Willkommens-E-Mail wurde erneut gesendet.',
    });
    await onComplete?.();
  }, [tenantId, userId, onComplete]);

  const buttonClass = compact
    ? 'mt-1.5 rounded border border-neon-cyan/30 px-2 py-0.5 text-[10px] font-medium text-neon-cyan hover:bg-neon-cyan/10 disabled:cursor-not-allowed disabled:opacity-40'
    : 'rounded border border-neon-cyan/30 px-2 py-1 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/10 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <>
      {toast ?
        <ControlCenterToast toast={toast} onDismiss={() => setToast(null)} />
      : null}
      <button
        type="button"
        className={buttonClass}
        disabled={!canResend || sending}
        title={!canResend ? disabledReason : 'Willkommensmail erneut senden'}
        onClick={() => {
          if (!canResend) return;
          setConfirmOpen(true);
        }}
      >
        <span className="inline-flex items-center gap-1">
          <Mail className="h-3 w-3" />
          {sending ? 'Wird gesendet…' : 'Erneut senden'}
        </span>
      </button>

      <ModalShell
        title="Willkommensmail erneut senden?"
        open={confirmOpen}
        onClose={() => {
          if (!sending) setConfirmOpen(false);
        }}
        footer={
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white"
              disabled={sending}
              onClick={() => setConfirmOpen(false)}
            >
              Abbrechen
            </button>
            <button
              type="button"
              className="rounded-lg bg-neon-cyan/20 px-4 py-2 text-sm font-medium text-neon-cyan hover:bg-neon-cyan/30 disabled:opacity-50"
              disabled={sending}
              onClick={() => void runResend()}
            >
              {sending ? 'Wird gesendet…' : 'Erneut senden'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-300">
          Die Willkommens-E-Mail wird erneut an{' '}
          <span className="font-medium text-white">{displayEmail}</span> gesendet.
        </p>
      </ModalShell>
    </>
  );
}

function ControlCenterToast({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const border =
    toast.type === 'success' ? 'border-neon-green/40 bg-neon-green/10' : 'border-neon-red/40 bg-neon-red/10';
  const text = toast.type === 'success' ? 'text-neon-green' : 'text-neon-red';

  return (
    <div
      className={`fixed bottom-4 right-4 z-[60] max-w-sm rounded-lg border p-3 shadow-lg ${border}`}
      role="status"
    >
      <p className={`text-sm font-medium ${text}`}>{toast.message}</p>
      {toast.detail ?
        <p className="mt-1 text-xs text-slate-400">{toast.detail}</p>
      : null}
      <button
        type="button"
        className="mt-2 text-xs text-slate-500 hover:text-slate-300"
        onClick={onDismiss}
      >
        Schließen
      </button>
    </div>
  );
}
