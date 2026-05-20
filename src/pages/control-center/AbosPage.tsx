import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Tenant, TenantSubscriptionPatch } from '../../types';
import { useControlCenter } from '../../context/ControlCenterContext';
import { PageHeader } from '../../components/control-center/PageHeader';
import { SubscriptionRevenueCards } from '../../components/control-center/SubscriptionRevenueCards';
import { AbosTable } from '../../components/control-center/AbosTable';
import { ActivateSubscriptionModal } from '../../components/control-center/ActivateSubscriptionModal';
import { ChangePlanModal } from '../../components/control-center/ChangePlanModal';
import {
  ExtendTrialModal,
  type ExtendTrialPayload,
} from '../../components/control-center/ExtendTrialModal';
import { ManualActivatePaymentModal } from '../../components/control-center/ManualActivatePaymentModal';
import { MarkPaymentFailedModal } from '../../components/control-center/MarkPaymentFailedModal';
import { TenantDetailsModal } from '../../components/control-center/TenantDetailsModal';
import type { TenantAction } from '../../components/control-center/TenantActionMenu';
import { CC_ROUTES } from '../../control-center/routes';
import { subscriptionErrorMessage } from '../../utils/subscriptionMessages';
import { formatTrialEnd } from '../../utils/format';
import { trialExtendErrorMessage } from '../../utils/trialExtend';

type ModalKind =
  | 'details'
  | 'plan'
  | 'trial'
  | 'activate'
  | 'release'
  | 'paymentFailed'
  | null;

export function AbosPage() {
  const { data, isLive, loading, search, refresh, serverApiOnline } = useControlCenter();
  const navigate = useNavigate();
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [flash, setFlash] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const paymentsConfigured = data?.health?.payments?.configured !== false;
  const paymentsMsg = data?.health?.payments?.message;
  const apiOffline = !serverApiOnline && !loading;

  const patchSubscription = useCallback(
    async (tenantId: string, patch: TenantSubscriptionPatch) => {
      const result = await api.patchTenantSubscription(tenantId, patch);
      if (!result.ok) throw new Error(subscriptionErrorMessage(result));
      await refresh();
    },
    [refresh],
  );

  const showFlash = (message: string, type: 'success' | 'error') => {
    setFlash({ message, type });
    window.setTimeout(() => setFlash(null), 8000);
  };

  const handleAction = async (action: TenantAction, tenant: Tenant) => {
    setActiveTenant(tenant);
    switch (action) {
      case 'details':
      case 'openCustomer':
        setModal('details');
        break;
      case 'changePlan':
        setModal('plan');
        break;
      case 'extendTrial':
        setModal('trial');
        break;
      case 'activate':
        setModal('activate');
        break;
      case 'releaseSubscription':
        setModal('release');
        break;
      case 'markPaymentFailed':
        setModal('paymentFailed');
        break;
      case 'keepPaymentOpen':
        showFlash('Zahlung bleibt auf „ausstehend“ – keine Änderung vorgenommen.', 'success');
        setActiveTenant(null);
        break;
      case 'block':
        await patchSubscription(tenant.id, {
          subscription_status: 'blocked',
          blocked_reason: 'Gesperrt über Control Center',
        });
        showFlash(`Tenant „${tenant.name}" gesperrt.`, 'success');
        break;
      case 'unblock':
        await patchSubscription(tenant.id, {
          subscription_status: 'active',
          blocked_reason: null,
        });
        showFlash(`Tenant „${tenant.name}" entsperrt.`, 'success');
        break;
      case 'logs':
        navigate(`${CC_ROUTES.logs}?tenant=${encodeURIComponent(tenant.id)}`);
        break;
      default:
        break;
    }
  };

  const handleSavePatch = async (patch: TenantSubscriptionPatch) => {
    if (!activeTenant) return;
    await patchSubscription(activeTenant.id, patch);
    showFlash('Änderung gespeichert.', 'success');
    setModal(null);
    setActiveTenant(null);
  };

  const handleManualActivate = async (patch: TenantSubscriptionPatch) => {
    if (!activeTenant) return;
    await patchSubscription(activeTenant.id, patch);
    showFlash(`Abo für „${activeTenant.name}" freigeschaltet.`, 'success');
    setModal(null);
    setActiveTenant(null);
  };

  const handlePaymentFailed = async (patch: TenantSubscriptionPatch) => {
    if (!activeTenant) return;
    await patchSubscription(activeTenant.id, patch);
    showFlash(`Zahlung für „${activeTenant.name}" als fehlgeschlagen markiert.`, 'success');
    setModal(null);
    setActiveTenant(null);
  };

  const handleExtendTrial = async (payload: ExtendTrialPayload) => {
    if (!activeTenant) throw new Error('Kein Tenant ausgewählt.');
    const result = await api.extendTenantTrial(activeTenant.id, payload);
    if (!result.ok) {
      const message = trialExtendErrorMessage(result.code ?? result.error, result.message);
      setFlash({ message, type: 'error' });
      throw new Error(message);
    }
    const response = result.data as {
      message?: string;
      data?: { newTrialEnd?: string };
    };
    const newEnd = response.data?.newTrialEnd;
    showFlash(
      newEnd
        ? `Testzeitraum wurde verlängert. Neues Trial-Ende: ${formatTrialEnd(newEnd)}`
        : 'Testzeitraum wurde verlängert.',
      'success',
    );
    setModal(null);
    setActiveTenant(null);
    await refresh();
    return { newTrialEnd: newEnd ?? '' };
  };

  const tenants = isLive && !apiOffline ? (data?.tenants ?? []) : [];
  const hasPending = tenants.some(
    (t) => t.payment_status === 'pending' || t.status === 'pending_payment',
  );

  return (
    <>
      <PageHeader
        title="Abos"
        subtitle="SumUp-Zahlungen, manuelle Freischaltung und Abo-Verwaltung"
      />
      {!paymentsConfigured ?
        <p className="mb-4 rounded-lg border border-white/10 bg-navy-900/60 px-4 py-2 text-xs text-slate-400">
          {paymentsMsg ?? 'Zahlungssystem noch nicht konfiguriert'}
        </p>
      : null}
      {flash ?
        <div
          className={`mb-4 rounded-lg border px-4 py-2 text-sm ${
            flash.type === 'success'
              ? 'border-neon-green/40 bg-neon-green/10 text-neon-green'
              : 'border-neon-red/40 bg-neon-red/10 text-red-200'
          }`}
        >
          {flash.message}
        </div>
      : null}
      <SubscriptionRevenueCards
        data={isLive && !apiOffline ? (data?.subscriptions ?? null) : null}
        unavailable={!isLive && !loading}
        loading={loading && isLive}
        apiOffline={apiOffline}
      />
      <div className="mt-4">
        <AbosTable
          tenants={tenants}
          search={search}
          disabled={!isLive || apiOffline}
          emptyMessage={
            apiOffline ?
              'Haupt-App nicht erreichbar.'
            : !hasPending && tenants.length > 0 ?
              undefined
            : tenants.length === 0 && !loading ?
              'Keine offenen SumUp-Zahlungen.'
            : undefined
          }
          onAction={(action, tenant) => void handleAction(action, tenant)}
        />
      </div>
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
        onClose={() => setModal(null)}
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
    </>
  );
}
