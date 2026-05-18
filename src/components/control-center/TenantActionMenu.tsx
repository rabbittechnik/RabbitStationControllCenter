import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Tenant } from '../../types';

interface TenantActionMenuProps {
  tenant: Tenant;
  onSupport: (tenant: Tenant) => void;
  onDetails: (tenant: Tenant) => void;
}

export function TenantActionMenu({ tenant, onSupport, onDetails }: TenantActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    { label: 'Details öffnen', onClick: () => onDetails(tenant) },
    { label: 'Support-Zugriff starten', onClick: () => onSupport(tenant) },
    { label: 'Trial verlängern', onClick: () => alert(`Trial für ${tenant.name} verlängern (Demo)`) },
    { label: 'Plan ändern', onClick: () => alert(`Plan für ${tenant.name} ändern (Demo)`) },
    {
      label: tenant.locked ? 'Entsperren' : 'Sperren',
      onClick: () => alert(`${tenant.name} ${tenant.locked ? 'entsperren' : 'sperren'} (Demo)`),
    },
    { label: 'Logs anzeigen', onClick: () => alert(`Logs für ${tenant.name} (Demo)`) },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-white"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-white/10 bg-navy-850 py-1 shadow-xl">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => {
                a.onClick();
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-neon-cyan"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
