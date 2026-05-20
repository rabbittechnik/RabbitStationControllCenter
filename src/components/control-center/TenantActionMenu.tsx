import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Tenant } from '../../types';
import { canExtendTrial, extendTrialDisabledReason } from '../../utils/trialExtend';

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
  const extendAllowed = canExtendTrial(tenant);
  const extendTooltip = extendTrialDisabledReason(tenant);

  const actions: {
    key: TenantAction;
    label: string;
    hidden?: boolean;
    disabled?: boolean;
    title?: string;
  }[] = [
    { key: 'details', label: 'Details öffnen' },
    { key: 'changePlan', label: 'Plan ändern' },
    {
      key: 'extendTrial',
      label: 'Testzeit verlängern',
      hidden: !extendAllowed && !extendTooltip,
      disabled: !extendAllowed,
      title: extendTooltip ?? undefined,
    },
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
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[220px] rounded-lg border border-white/10 bg-navy-850 py-1 shadow-xl">
          {actions
            .filter((a) => !a.hidden)
            .map((a) => (
              <button
                key={a.key}
                type="button"
                disabled={a.disabled}
                title={a.title}
                onClick={() => {
                  if (a.disabled) return;
                  onAction(a.key, tenant);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-neon-cyan disabled:cursor-not-allowed disabled:opacity-40"
              >
                {a.label}
              </button>
            ))}
        </div>
      : null}
    </div>
  );
}
