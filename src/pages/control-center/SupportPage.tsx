import { useCallback, useEffect, useMemo, useState } from 'react';
import { Headphones, Plus, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { PageHeader } from '../../components/control-center/PageHeader';
import { StartSupportSessionModal } from '../../components/control-center/StartSupportSessionModal';
import type { StartSupportForm } from '../../components/control-center/StartSupportSessionModal';
import { SupportSessionDetailsModal } from '../../components/control-center/SupportSessionDetailsModal';
import { SupportSessionsTable } from '../../components/control-center/SupportSessionsTable';
import type { SupportSession, Tenant } from '../../types';
import { supportApiErrorMessage, supportSessionStats } from '../../utils/supportSessions';

export function SupportPage() {
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startOpen, setStartOpen] = useState(false);
  const [detailsSession, setDetailsSession] = useState<SupportSession | null>(null);
  const [impersonationUrls, setImpersonationUrls] = useState<Record<string, string>>({});
  const [successBanner, setSuccessBanner] = useState<{
    message: string;
    impersonationUrl?: string;
  } | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.getSupportSessions(
      statusFilter ? { status: statusFilter } : undefined,
    );
    if (!result.ok) {
      setSessions([]);
      setError(supportApiErrorMessage(result));
      setLoading(false);
      return;
    }
    setSessions(result.data.sessions ?? []);
    setLoading(false);
  }, [statusFilter]);

  const loadTenants = useCallback(async () => {
    setTenantsLoading(true);
    const result = await api.getTenants();
    if (result.ok) {
      setTenants(result.data.tenants ?? []);
    } else {
      setTenants([]);
    }
    setTenantsLoading(false);
  }, []);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const stats = useMemo(() => supportSessionStats(sessions), [sessions]);

  const handleStart = async (form: StartSupportForm) => {
    const result = await api.startSupportSession(form.tenantId, {
      reason: form.reason,
      accessMode: form.accessMode,
      durationMinutes: form.durationMinutes,
    });
    if (!result.ok) {
      throw new Error(supportApiErrorMessage(result));
    }
    const { supportSession, impersonationUrl } = result.data;
    setImpersonationUrls((prev) => ({ ...prev, [supportSession.id]: impersonationUrl }));
    setSuccessBanner({
      message: 'Support-Sitzung wurde gestartet.',
      impersonationUrl,
    });
    setStartOpen(false);
    await loadSessions();
  };

  const handleEnd = async (session: SupportSession) => {
    if (!window.confirm('Möchten Sie diese Support-Sitzung wirklich beenden?')) return;
    const result = await api.endSupportSession(session.id);
    if (!result.ok) {
      setError(supportApiErrorMessage(result));
      return;
    }
    setImpersonationUrls((prev) => {
      const next = { ...prev };
      delete next[session.id];
      return next;
    });
    await loadSessions();
  };

  const handleOpen = (session: SupportSession) => {
    const url = impersonationUrls[session.id];
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const emptyMessage =
    error ? undefined
    : loading ? undefined
    : sessions.length === 0 ? 'Keine Support-Sitzungen vorhanden.'
    : undefined;

  return (
    <>
      <PageHeader
        title="Support-Zugriffe"
        subtitle="Starten und verwalten Sie zeitlich begrenzte Support-Sitzungen für Kunden-Tenants."
        actions={
          <>
            <button
              type="button"
              onClick={() => void loadSessions()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </button>
            <button
              type="button"
              onClick={() => setStartOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-neon-cyan/20 px-3 py-2 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/30"
            >
              <Plus className="h-4 w-4" />
              Support-Zugriff starten
            </button>
          </>
        }
      />

      <div className="mb-4 rounded-lg border border-neon-orange/30 bg-neon-orange/10 px-4 py-3 text-sm text-orange-100">
        <Headphones className="mb-1 inline h-4 w-4 text-neon-orange" /> Support-Zugriffe werden
        protokolliert. Starten Sie eine Sitzung nur mit berechtigtem Grund oder auf Kundenwunsch.
      </div>

      {error ?
        <div className="mb-4 rounded-lg border border-neon-red/40 bg-neon-red/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      : null}

      {successBanner ?
        <div className="mb-4 rounded-lg border border-neon-green/40 bg-neon-green/10 px-4 py-3 text-sm text-neon-green">
          <p>{successBanner.message}</p>
          {successBanner.impersonationUrl ?
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-neon-cyan/20 px-3 py-2 text-xs font-medium text-neon-cyan hover:bg-neon-cyan/30"
              onClick={() =>
                window.open(successBanner.impersonationUrl, '_blank', 'noopener,noreferrer')
              }
            >
              Haupt-App im Support-Modus öffnen
            </button>
          : null}
        </div>
      : null}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Aktive Support-Sitzungen" value={stats.active} highlight />
        <StatCard label="Heute gestartete Sitzungen" value={stats.startedToday} />
        <StatCard label="Abgelaufene Sitzungen" value={stats.expired} />
        <StatCard label="Beendete Sitzungen" value={stats.ended} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-500">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-navy-850 px-3 py-1.5 text-xs text-white"
        >
          <option value="">Alle</option>
          <option value="active">Aktiv</option>
          <option value="ended">Beendet</option>
          <option value="expired">Abgelaufen</option>
          <option value="revoked">Widerrufen</option>
        </select>
      </div>

      {loading && sessions.length === 0 ?
        <p className="text-sm text-slate-500">Support-Sitzungen werden geladen…</p>
      : <SupportSessionsTable
          sessions={sessions}
          emptyMessage={emptyMessage}
          impersonationUrls={impersonationUrls}
          onOpen={handleOpen}
          onEnd={(s) => void handleEnd(s)}
          onDetails={setDetailsSession}
        />
      }

      <StartSupportSessionModal
        open={startOpen}
        tenants={tenants}
        loading={tenantsLoading}
        onClose={() => setStartOpen(false)}
        onSubmit={handleStart}
      />

      <SupportSessionDetailsModal
        session={detailsSession}
        open={Boolean(detailsSession)}
        onClose={() => setDetailsSession(null)}
      />
    </>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${highlight ? 'text-neon-cyan' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
