import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalShellProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export const inputClass =
  'w-full rounded-lg border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white focus:border-neon-cyan/40 focus:outline-none';

export const labelClass = 'mb-1 block text-xs text-slate-500';

export function ModalShell({ title, open, onClose, children, footer }: ModalShellProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Panel title={title} onClose={onClose}>
        {children}
        {footer}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="glass-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-glow">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Schließen">
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  );
}

export function AuditLogHint() {
  return (
    <p className="text-xs text-slate-500">
      Diese Änderung wird in der Haupt-App im Audit-Log protokolliert.
    </p>
  );
}

export function ModalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
