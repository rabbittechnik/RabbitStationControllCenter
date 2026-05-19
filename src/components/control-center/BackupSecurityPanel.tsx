import type { BackupStatus, SecuritySummary } from '../../types';
import { formatDateTime } from '../../utils/format';

interface BackupSecurityPanelProps {
  backups: BackupStatus | null;
  security: SecuritySummary | null;
  onRunBackupCheck: () => void;
  checking?: boolean;
  unavailable?: boolean;
}

export function BackupSecurityPanel({
  backups,
  security,
  onRunBackupCheck,
  checking,
  unavailable,
}: BackupSecurityPanelProps) {
  if (unavailable) {
    return (
      <div className="glass-card p-4">
        <h3 className="mb-2 text-sm font-semibold text-white">Backups &amp; Sicherheit</h3>
        <p className="text-xs text-slate-500">Keine Sicherheitsdaten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Backups & Sicherheit</h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <p className="text-slate-500">
            Letztes Backup:{' '}
            <span className="text-slate-300">
              {backups ? formatDateTime(backups.lastBackupAt) : '–'}
            </span>
          </p>
          <p className="text-slate-500">
            Nächstes Backup:{' '}
            <span className="text-slate-300">
              {backups ? formatDateTime(backups.nextBackupAt) : '–'}
            </span>
          </p>
          <p>
            Backup Status:{' '}
            <span
              className={`font-medium ${
                backups?.configured === false ? 'text-neon-orange' : 'text-neon-green'
              }`}
            >
              {backups?.configured === false ?
                backups.message ?? 'Backup-System noch nicht konfiguriert'
              : backups?.lastBackupStatus === 'success' ?
                'Erfolgreich'
              : (backups?.lastBackupStatus ?? 'Unbekannt')}
            </span>
          </p>
        </div>
        <div className="space-y-2">
          <p>
            Fehlgeschlagene Logins:{' '}
            <span className="font-medium text-neon-orange">
              {security?.failedLogins24h ?? 0} letzte 24h
            </span>
          </p>
          <p>
            Support-Sitzungen:{' '}
            <span className="font-medium text-neon-cyan">
              {security?.activeSupportSessions ?? 0} aktiv
            </span>
          </p>
          <p>
            Rollenänderungen:{' '}
            <span className="font-medium text-neon-orange">
              {security?.roleChanges24h ?? 0} letzte 24h
            </span>
          </p>
          <p>
            Gesperrte Tenants:{' '}
            <span className="font-medium text-neon-red">
              {security?.blockedTenants ?? 0}
            </span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRunBackupCheck}
          disabled={checking}
          className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-50"
        >
          {checking ? 'Prüfe…' : 'Backup prüfen'}
        </button>
        <button
          type="button"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
        >
          Sicherheitslogs öffnen
        </button>
      </div>
    </div>
  );
}
