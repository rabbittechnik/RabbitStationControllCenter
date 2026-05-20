import { useRef, useState } from 'react';
import {
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  Headphones,
  Layers,
  Lock,
  LockOpen,
  MoreHorizontal,
  Timer,
  Unlock,
  XCircle,
} from 'lucide-react';
import type { Tenant } from '../../types';
import { isPaymentPending } from '../../utils/paymentDisplay';
import { canExtendTrial, extendTrialDisabledReason } from '../../utils/trialExtend';
import { ActionMenuDivider, ActionMenuItem, ActionMenuPortal } from './ActionMenuPortal';

export type TenantAction =
  | 'details'
  | 'openCustomer'
  | 'changePlan'
  | 'extendTrial'
  | 'activate'
  | 'releaseSubscription'
  | 'keepPaymentOpen'
  | 'markPaymentFailed'
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
  const anchorRef = useRef<HTMLButtonElement>(null);

  const isBlocked = tenant.status === 'blocked' || tenant.locked === 1;
  const extendAllowed = canExtendTrial(tenant);
  const extendTooltip = extendTrialDisabledReason(tenant);
  const paymentPending = isPaymentPending(tenant);

  const run = (action: TenantAction) => {
    onAction(action, tenant);
    setOpen(false);
  };

  const actions: {
    key: TenantAction;
    label: string;
    hidden?: boolean;
    disabled?: boolean;
    title?: string;
    icon?: React.ReactNode;
    dividerBefore?: boolean;
  }[] = [
    { key: 'details', label: 'Details öffnen', icon: <FileText className="h-4 w-4" /> },
    { key: 'openCustomer', label: 'Kunde öffnen', icon: <Building2 className="h-4 w-4" /> },
    { key: 'changePlan', label: 'Plan ändern', icon: <Layers className="h-4 w-4" />, dividerBefore: true },
    {
      key: 'extendTrial',
      label: 'Testzeit verlängern',
      icon: <Timer className="h-4 w-4" />,
      hidden: !extendAllowed && !extendTooltip,
      disabled: !extendAllowed,
      title: extendTooltip ?? undefined,
    },
    { key: 'activate', label: 'Abo aktivieren', icon: <Unlock className="h-4 w-4" /> },
    {
      key: 'releaseSubscription',
      label: 'Abo freischalten',
      icon: <Unlock className="h-4 w-4" />,
      hidden: !paymentPending,
    },
    {
      key: 'keepPaymentOpen',
      label: 'Zahlung offen lassen',
      icon: <CreditCard className="h-4 w-4" />,
      hidden: !paymentPending,
      title: 'Status bleibt „Zahlung ausstehend“',
    },
    {
      key: 'markPaymentFailed',
      label: 'Zahlung fehlgeschlagen markieren',
      icon: <XCircle className="h-4 w-4" />,
      hidden: !paymentPending,
    },
    {
      key: isBlocked ? 'unblock' : 'block',
      label: isBlocked ? 'Tenant entsperren' : 'Abo pausieren/sperren',
      icon: isBlocked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />,
      dividerBefore: true,
    },
    { key: 'logs', label: 'Logs anzeigen', icon: <ClipboardList className="h-4 w-4" /> },
    {
      key: 'support',
      label: 'Support-Zugriff starten',
      icon: <Headphones className="h-4 w-4" />,
    },
  ];

  const visible = actions.filter((a) => !a.hidden);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-white disabled:opacity-40"
        aria-label="Aktionen"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <ActionMenuPortal
        open={open && !disabled}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        ariaLabel={`Aktionen für ${tenant.name}`}
      >
        {visible.map((a) => (
          <div key={a.key}>
            {a.dividerBefore ? <ActionMenuDivider /> : null}
            <ActionMenuItem
              label={a.label}
              icon={a.icon}
              disabled={a.disabled}
              title={a.title}
              onClick={() => {
                if (a.disabled) return;
                run(a.key);
              }}
            />
          </div>
        ))}
      </ActionMenuPortal>
    </>
  );
}
