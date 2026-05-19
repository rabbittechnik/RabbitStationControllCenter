import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Tenant } from '../../types';

export type TenantAction =
  | 'details'
  | 'changePlan'
  | 'extendTrial'
  | 'activate'
  | 'block'
  | 'unblock'
  | 'logs'
  | 'support';

interface TenantActionMenuProps {
  tenant: Tenant;
  disabled?: boolean;
  onAction: (action: TenantAction, tenant: Tenant) => void;
}

export function TenantActionMenu({ tenant, disabled, onAction }: TenantActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isBlocked = tenant.status === 'blocked' || tenant.locked === 1;

  const actions: { key: TenantAction; label: string; hidden?: boolean }[] = [
    { key: 'details', label: 'Details öffnen' },
    { key: 'changePlan', label: 'Plan ändern' },
    { key: 'extendTrial', label: 'Trial verlängern' },
    { key: 'activate', label: 'Abo aktivieren' },
    {
      key: isBlocked ? 'unblock' : 'block',
      label: isBlocked ? 'Tenant entsperren' : 'Abo pausieren/sperren',
    },
    { key: 'logs', label: 'Logs anzeigen' },
    { key: 'support', label: 'Support-Zugriff starten' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-white disabled:opacity-40"
        aria-label="Aktionen"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && !disabled ?
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-white/10 bg-navy-850 py-1 shadow-xl">
          {actions
            .filter((a) => !a.hidden)
            .map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => {
                  onAction(a.key, tenant);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-neon-cyan"
              >
                {a.label}
              </button>
            ))}
        </div>
      : null}
    </div>
  );
}
