import { useCallback, useState } from 'react';
import { api } from '../../api/client';
import type { Tenant, TenantSubscriptionPatch } from '../../types';
import {
  SUBSCRIPTION_SUCCESS,
  subscriptionErrorMessage,
} from '../../utils/subscriptionMessages';
import { formatTrialEnd } from '../../utils/format';
import { trialExtendErrorMessage } from '../../utils/trialExtend';
import { ActivateSubscriptionModal } from './ActivateSubscriptionModal';
import { ChangePlanModal } from './ChangePlanModal';
import { ExtendTrialModal, type ExtendTrialPayload } from './ExtendTrialModal';
import { ManualActivatePaymentModal } from './ManualActivatePaymentModal';
import { MarkPaymentFailedModal } from './MarkPaymentFailedModal';
import { SupportAccessModal } from './SupportAccessModal';
import { TenantDetailsModal } from './TenantDetailsModal';
import { TenantOverviewTable } from './TenantOverviewTable';

type ModalKind =
  | 'details'
  | 'plan'
  | 'trial'
  | 'activate'
  | 'release'
  | 'paymentFailed'
  | 'support'
  | null;

interface TenantSubscriptionManagerProps {
  tenants: Tenant[];
  search: string;
  disabled?: boolean;
  emptyMessage?: string;
  onUpdated: () => Promise<void>;
  onShowLogs?: (tenantId: string) => void;
  toast?: (message: string, type: 'success' | 'error') => void;
}

export function TenantSubscriptionManager({
  tenants,
  search,
  disabled,
  emptyMessage,
  onUpdated,
  onShowLogs,
  toast,
}: TenantSubscriptionManagerProps) {
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [flash, setFlash] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const notify = useCallback(
    (message: string, type: 'success' | 'error') => {
      if (toast) toast(message, type);
      else setFlash({ message, type });
      if (type === 'success') {
        window.setTimeout(() => setFlash(null), 5000);
      }
    },
    [toast],
  );

  const patchSubscription = useCallback(
    async (tenantId: string, patch: TenantSubscriptionPatch) => {
      const result = await api.patchTenantSubscription(tenantId, patch);
      if (!result.ok) {
        notify(subscriptionErrorMessage(result), 'error');
        throw new Error(result.message);
      }
      notify(SUBSCRIPTION_SUCCESS, 'success');
      await onUpdated();
    },
    [notify, onUpdated],
  );

  const handleSavePatch = async (patch: TenantSubscriptionPatch) => {
    if (!activeTenant) return;
    await patchSubscription(activeTenant.id, patch);
    setModal(null);
    setActiveTenant(null);
  };

  const handleManualActivate = async (patch: TenantSubscriptionPatch) => {
    if (!activeTenant) return;
    await patchSubscription(activeTenant.id, patch);
    notify(`Abo für „${activeTenant.name}" freigeschaltet.`, 'success');
    setModal(null);
    setActiveTenant(null);
  };

  const handlePaymentFailed = async (patch: TenantSubscriptionPatch) => {
    if (!activeTenant) return;
    await patchSubscription(activeTenant.id, patch);
    notify(`Zahlung für „${activeTenant.name}" als fehlgeschlagen markiert.`, 'success');
    setModal(null);
    setActiveTenant(null);
  };

  const handleExtendTrial = async (payload: ExtendTrialPayload) => {
    if (!activeTenant) throw new Error('Kein Tenant ausgewählt.');
    const result = await api.extendTenantTrial(activeTenant.id, payload);
    if (!result.ok) {
      const message = trialExtendErrorMessage(result.code ?? result.error, result.message);
      notify(message, 'error');
      throw new Error(message);
    }
    const response = result.data as {
      message?: string;
      data?: { newTrialEnd?: string };
    };
    const newEnd = response.data?.newTrialEnd;
    notify(
      newEnd
        ? `Testzeitraum wurde verlängert. Neues Trial-Ende: ${formatTrialEnd(newEnd)}`
        : 'Testzeitraum wurde verlängert.',
      'success',
    );
    setModal(null);
    setActiveTenant(null);
    await onUpdated();
    return { newTrialEnd: newEnd ?? '' };
  };

  const handleBlock = async (tenant: Tenant) => {
    const reason = window.prompt('Grund für Sperrung (optional):', 'Gesperrt durch Control Center');
    if (reason === null) return;
    await patchSubscription(tenant.id, {
      subscription_status: 'blocked',
      blocked_reason: reason.trim() || 'Gesperrt durch Control Center',
      note: reason.trim() || undefined,
    });
  };

  const handleUnblock = async (tenant: Tenant) => {
    if (!window.confirm(`Tenant „${tenant.name}" entsperren?`)) return;
    await patchSubscription(tenant.id, {
      subscription_status: 'active',
      blocked_reason: null,
      note: 'Entsperrt über Control Center',
    });
  };

  const handleSupportConfirm = async (reason: string) => {
    if (!activeTenant) return;
    const result = await api.startSupportSession(activeTenant.id, {
      reason,
      accessMode: 'read_only',
      durationMinutes: 60,
    });
    if (!result.ok) {
      notify(
        result.code === 'forbidden' || result.code === 'unauthorized'
          ? 'Keine Berechtigung für Support-Zugriffe.'
          : result.message,
        'error',
      );
      throw new Error(result.message);
    }
    notify('Support-Zugriff gestartet.', 'success');
    if (result.data.impersonationUrl) {
      window.open(result.data.impersonationUrl, '_blank', 'noopener,noreferrer');
    }
    setModal(null);
    setActiveTenant(null);
  };

  return (
    <>
      {flash ?
        <div
          className={`mb-3 rounded-lg border px-4 py-2 text-sm ${
            flash.type === 'success' ?
              'border-neon-green/40 bg-neon-green/10 text-neon-green'
            : 'border-neon-red/40 bg-neon-red/10 text-red-200'
          }`}
        >
          {flash.message}
        </div>
      : null}
      <TenantOverviewTable
        tenants={tenants}
        search={search}
        disabled={disabled}
        emptyMessage={emptyMessage}
        onDetails={(t) => {
          setActiveTenant(t);
          setModal('details');
        }}
        onChangePlan={(t) => {
          setActiveTenant(t);
          setModal('plan');
        }}
        onExtendTrial={(t) => {
          setActiveTenant(t);
          setModal('trial');
        }}
        onActivate={(t) => {
          setActiveTenant(t);
          setModal('activate');
        }}
        onReleasePayment={(t) => {
          setActiveTenant(t);
          setModal('release');
        }}
        onMarkPaymentFailed={(t) => {
          setActiveTenant(t);
          setModal('paymentFailed');
        }}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onSupport={(t) => {
          setActiveTenant(t);
          setModal('support');
        }}
        onShowLogs={(t) => onShowLogs?.(t.id)}
      />
      <TenantDetailsModal
        tenant={activeTenant}
        open={modal === 'details'}
        onClose={() => setModal(null)}
      />
      <ChangePlanModal
        tenant={activeTenant}
        open={modal === 'plan'}
        onClose={() => setModal(null)}
        onSave={handleSavePatch}
      />
      <ExtendTrialModal
        tenant={activeTenant}
        open={modal === 'trial'}
        onClose={() => {
          setModal(null);
          setActiveTenant(null);
        }}
        onExtend={handleExtendTrial}
      />
      <ActivateSubscriptionModal
        tenant={activeTenant}
        open={modal === 'activate'}
        onClose={() => setModal(null)}
        onSave={handleSavePatch}
      />
      <ManualActivatePaymentModal
        tenant={activeTenant}
        open={modal === 'release'}
        onClose={() => {
          setModal(null);
          setActiveTenant(null);
        }}
        onActivate={handleManualActivate}
      />
      <MarkPaymentFailedModal
        tenant={activeTenant}
        open={modal === 'paymentFailed'}
        onClose={() => {
          setModal(null);
          setActiveTenant(null);
        }}
        onConfirm={handlePaymentFailed}
      />
      <SupportAccessModal
        tenant={activeTenant}
        open={modal === 'support'}
        onClose={() => {
          setModal(null);
          setActiveTenant(null);
        }}
        onConfirm={handleSupportConfirm}
      />
    </>
  );
}
