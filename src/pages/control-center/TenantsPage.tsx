import { useNavigate } from 'react-router-dom';
import { useControlCenter } from '../../context/ControlCenterContext';
import { PageHeader } from '../../components/control-center/PageHeader';
import { TenantSubscriptionManager } from '../../components/control-center/TenantSubscriptionManager';
import { CC_ROUTES } from '../../control-center/routes';

export function TenantsPage() {
  const { data, isLive, loading, search, refresh } = useControlCenter();
  const navigate = useNavigate();

  const empty =
    !isLive && !loading ? 'Tenants konnten nicht geladen werden.'
    : isLive && (data?.tenants?.length ?? 0) === 0 ? 'Keine Daten vorhanden'
    : undefined;

  return (
    <>
      <PageHeader
        title="Tenants"
        subtitle="Kunden- und Mandantenverwaltung · Live-Daten der Haupt-App"
      />
      <TenantSubscriptionManager
        tenants={isLive ? (data?.tenants ?? []) : []}
        search={search}
        disabled={!isLive}
        emptyMessage={empty}
        onUpdated={refresh}
        onShowLogs={(tenantId) =>
          navigate(`${CC_ROUTES.logs}?tenant=${encodeURIComponent(tenantId)}`)
        }
      />
    </>
  );
}
