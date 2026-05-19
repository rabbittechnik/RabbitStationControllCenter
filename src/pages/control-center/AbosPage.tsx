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
import { ExtendTrialModal } from '../../components/control-center/ExtendTrialModal';
import { TenantDetailsModal } from '../../components/control-center/TenantDetailsModal';
import type { TenantAction } from '../../components/control-center/TenantActionMenu';
import { CC_ROUTES } from '../../control-center/routes';
import { subscriptionErrorMessage } from '../../utils/subscriptionMessages';

type ModalKind = 'details' | 'plan' | 'trial' | 'activate' | null;

export function AbosPage() {
  const { data, isLive, loading, search, refresh } = useControlCenter();
  const navigate = useNavigate();
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);

  const paymentsConfigured = data?.health?.payments?.configured !== false;
  const paymentsMsg = data?.health?.payments?.message;

  const patchSubscription = useCallback(
    async (tenantId: string, patch: TenantSubscriptionPatch) => {
      const result = await api.patchTenantSubscription(tenantId, patch);
      if (!result.ok) throw new Error(subscriptionErrorMessage(result));
      await refresh();
    },
    [refresh],
  );

  const handleAction = async (action: TenantAction, tenant: Tenant) => {
    setActiveTenant(tenant);
    switch (action) {
      case 'details':
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
      case 'block':
        await patchSubscription(tenant.id, {
          subscription_status: 'blocked',
          blocked_reason: 'Gesperrt über Control Center',
        });
        break;
      case 'unblock':
        await patchSubscription(tenant.id, {
          subscription_status: 'active',
          blocked_reason: null,
        });
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
    setModal(null);
  };

  return (
    <>
      <PageHeader
        title="Abos"
        subtitle="Plan-, Testphasen- und Abo-Verwaltung"
      />
      {!paymentsConfigured ?
        <p className="mb-4 rounded-lg border border-white/10 bg-navy-900/60 px-4 py-2 text-xs text-slate-400">
          {paymentsMsg ?? 'Zahlungssystem noch nicht konfiguriert'}
        </p>
      : null}
      <SubscriptionRevenueCards
        data={isLive ? (data?.subscriptions ?? null) : null}
        unavailable={!isLive && !loading}
        loading={loading && isLive}
      />
      <div className="mt-4">
        <AbosTable
          tenants={isLive ? (data?.tenants ?? []) : []}
          search={search}
          disabled={!isLive}
          emptyMessage={!isLive && !loading ? 'Keine Daten vorhanden' : undefined}
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
        onSave={handleSavePatch}
      />
      <ActivateSubscriptionModal
        tenant={activeTenant}
        open={modal === 'activate'}
        onClose={() => setModal(null)}
        onSave={handleSavePatch}
      />
    </>
  );
}
