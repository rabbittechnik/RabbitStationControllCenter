import { RefreshCw } from 'lucide-react';
import { useControlCenter } from '../../context/ControlCenterContext';
import { PageHeader } from '../../components/control-center/PageHeader';
import { formatDateTime } from '../../utils/format';

const REFRESH_MS = 45_000;

export function SettingsPage() {
  const { data, config, meta, isLive, refreshing, refresh, loading } = useControlCenter();
  const health = data?.health;
  const mailConfigured = health?.mail?.configured !== false;
  const backupConfigured = data?.backups?.configured === true;
  const paymentsConfigured = health?.payments?.configured !== false;

  return (
    <>
      <PageHeader
        title="Einstellungen"
        subtitle="Control-Center-Konfiguration und Verbindung"
        actions={
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs text-neon-cyan disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Verbindung prüfen
          </button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsBlock title="Haupt-App Verbindung">
          <Row label="API URL" value={config?.apiUrlDisplay ?? (config?.apiUrlSet ? 'gesetzt' : 'fehlt')} />
          <Row
            label="CONTROL_CENTER_API_TOKEN"
            value={config?.tokenSet ? 'gesetzt' : 'fehlt'}
          />
          <Row label="Verbindungsstatus" value={isLive ? 'Verbunden' : meta?.message ?? 'Nicht verbunden'} />
          <Row label="Demo-Daten" value="deaktiviert" />
          <Row label="Auto-Refresh" value={`${(config?.refreshIntervalMs ?? REFRESH_MS) / 1000} Sek.`} />
        </SettingsBlock>
        <SettingsBlock title="Systemstatus (Kurz)">
          <Row label="Mail" value={mailConfigured ? 'Konfiguriert' : 'Nicht konfiguriert'} />
          <Row label="Backup" value={backupConfigured ? 'Konfiguriert' : 'Nicht konfiguriert'} />
          <Row label="Zahlungsanbieter" value={paymentsConfigured ? 'Angebunden' : 'Nicht konfiguriert'} />
          <Row label="Umgebung" value={data?.systemInfo?.environment ?? 'Nicht verfügbar'} />
          <Row label="Version CC" value={data?.systemInfo?.controlCenter?.version ?? 'Nicht verfügbar'} />
          <Row label="Build" value={data?.systemInfo?.controlCenter?.build ?? 'live'} />
          <Row label="Region" value={data?.systemInfo?.region ?? 'Nicht verfügbar'} />
          <Row
            label="Letzte Prüfung"
            value={health?.checkedAt ? formatDateTime(health.checkedAt) : loading ? 'Lädt…' : '–'}
          />
        </SettingsBlock>
      </div>
      <p className="mt-4 text-xs text-slate-600">
        Tokens werden aus Sicherheitsgründen niemals im Klartext angezeigt.
      </p>
    </>
  );
}

function SettingsBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
      <dl className="space-y-2 text-xs">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-200">{value}</dd>
    </div>
  );
}
