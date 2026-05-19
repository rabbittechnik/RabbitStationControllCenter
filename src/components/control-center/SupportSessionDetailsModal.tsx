import { X } from 'lucide-react';
import type { SupportSession } from '../../types';
import {
  formatSupportDateTime,
  formatSupportRemaining,
  supportAccessModeLabel,
  supportStatusLabel,
} from '../../utils/supportSessions';

interface SupportSessionDetailsModalProps {
  session: SupportSession | null;
  open: boolean;
  onClose: () => void;
}

export function SupportSessionDetailsModal({ session, open, onClose }: SupportSessionDetailsModalProps) {
  if (!open || !session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 shadow-glow">
        <motionlessSupportDetailsHeader onClose={onClose} />
        <motionlessSupportDetailsBody session={session} />
        <motionlessSupportDetailsFooter onClose={onClose} />
      </div>
    </div>
  );
}

function motionlessSupportDetailsHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-white">Support-Sitzung Details</h3>
      <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function motionlessSupportDetailsBody({ session }: { session: SupportSession }) {
  return (
    <dl className="space-y-3 text-sm">
      <DetailRow label="Tenant / Firma" value={session.tenantName} />
      <DetailRow label="Station" value={session.stationName ?? '–'} />
      <DetailRow label="Admin" value={session.adminEmail ?? '–'} />
      <DetailRow label="Grund" value={session.reason} />
      <DetailRow label="Modus" value={supportAccessModeLabel(session.accessMode)} />
      <DetailRow label="Status" value={supportStatusLabel(session.status)} />
      <DetailRow label="Startzeit" value={formatSupportDateTime(session.startedAt)} />
      <DetailRow label="Ablaufzeit" value={formatSupportDateTime(session.expiresAt)} />
      <DetailRow label="Restzeit" value={formatSupportRemaining(session.expiresAt, session.status)} />
      <DetailRow label="Beendet am" value={formatSupportDateTime(session.endedAt)} />
      <DetailRow label="Sitzungs-ID" value={session.id} mono />
    </dl>
  );
}

function motionlessSupportDetailsFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-6 flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300"
      >
        Schließen
      </button>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <motionlessSupportDetailRow label={label} value={value} mono={mono} />
  );
}

function motionlessSupportDetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-slate-200 ${mono ? 'font-mono text-xs break-all' : ''}`}>{value}</dd>
    </div>
  );
}
