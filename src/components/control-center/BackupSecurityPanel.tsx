import type { BackupStatus, SecuritySummary } from '../../types';
import { formatDateTime } from '../../utils/format';

interface BackupSecurityPanelProps {
  backups: BackupStatus | null;
  security: SecuritySummary | null;
  onRunBackupCheck: () => void;
  checking?: boolean;
  unavailable?: boolean;
}

function backupStatusLabel(backups: BackupStatus | null): { text: string; className: string } {
  if (!backups || backups.configured === false) {
    return {
      text: backups?.message ?? 'Backup-System noch nicht konfiguriert',
      className: 'text-slate-300',
    };
  }
  if (backups.lastBackupStatus === 'success') {
    return { text: 'Erfolgreich', className: 'text-neon-green' };
  }
  if (backups.lastBackupStatus === 'error' || backups.lastBackupStatus === 'failed') {
    return { text: 'Fehler', className: 'text-neon-red' };
  }
  return { text: 'Unbekannt', className: 'text-slate-400' };
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

  const backupLabel = backupStatusLabel(backups);
  const configured = backups?.configured === true;

  return (
    <div id="cc-section-backups" className="glass-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Backups &amp; Sicherheit</h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          {configured ?
            <>
              <p className="text-slate-500">
                Letztes Backup:{' '}
                <span className="text-slate-300">
                  {backups?.lastBackupAt ? formatDateTime(backups.lastBackupAt) : '–'}
                </span>
              </p>
              <p className="text-slate-500">
                Nächstes Backup:{' '}
                <span className="text-slate-300">
                  {backups?.nextBackupAt ? formatDateTime(backups.nextBackupAt) : '–'}
                </span>
              </p>
            </>
          : <p className="text-slate-400">Noch nicht eingerichtet</p>}
          <p>
            Backup-Status:{' '}
            <span className={`font-medium ${backupLabel.className}`}>{backupLabel.text}</span>
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
            <span className="font-medium text-neon-red">{security?.blockedTenants ?? 0}</span>
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
          {checking ? 'Prüfe…' : configured ? 'Backup prüfen' : 'Backup einrichten'}
        </button>
      </div>
    </div>
  );
}
