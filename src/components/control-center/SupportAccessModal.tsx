import { useState } from 'react';
import { X } from 'lucide-react';
import type { Tenant } from '../../types';

interface SupportAccessModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function SupportAccessModal({ tenant, open, onClose, onConfirm }: SupportAccessModalProps) {
  const [reason, setReason] = useState('Kundensupport');
  const [loading, setLoading] = useState(false);

  if (!open || !tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(reason);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 shadow-glow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Support-Zugriff starten</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Support-Sitzung für <strong className="text-neon-cyan">{tenant.name}</strong> starten.
          Dieser Zugriff wird im Audit-Log protokolliert.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Grund</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-navy-850 px-3 py-2 text-sm text-white focus:border-neon-cyan/40 focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
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
              {loading ? 'Starte…' : 'Zugriff starten'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
