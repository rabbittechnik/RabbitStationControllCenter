import { useControlCenter } from '../../context/ControlCenterContext';
import { PageHeader } from '../../components/control-center/PageHeader';
import { formatDateTime } from '../../utils/format';
import { safeText } from '../../utils/safeDisplay';

export function BackupsPage() {
  const { data, isLive, loading, runBackupCheck, backupChecking } = useControlCenter();
  const backups = data?.backups;
  const configured = backups?.configured === true;

  return (
    <>
      <PageHeader
        title="Backups"
        subtitle="Backup-Status und Historie"
        actions={
          <button
            type="button"
            onClick={() => void runBackupCheck()}
            disabled={!isLive || backupChecking}
            className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1.5 text-xs text-neon-cyan hover:bg-neon-cyan/20 disabled:opacity-50"
          >
            {backupChecking ? 'Prüfe…' : configured ? 'Backup prüfen' : 'Backup einrichten'}
          </button>
        }
      />
      {!isLive && !loading ?
        <p className="glass-card p-6 text-sm text-slate-500">Keine Daten vorhanden</p>
      : <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card p-4 text-sm">
            <p className="text-slate-500">Backup-Systemstatus</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {configured ? 'Eingerichtet' : 'Nicht konfiguriert'}
            </p>
            {!configured ?
              <p className="mt-2 text-xs text-slate-400">
                Das Backup-System wurde noch nicht angebunden.
              </p>
            : null}
          </div>
          <div className="glass-card p-4 text-sm">
            <p className="text-slate-500">Letzter Status</p>
            <p className="mt-1 font-medium text-slate-200">
              {configured ?
                safeText(backups?.lastBackupStatus, 'Unbekannt')
              : safeText(backups?.message, 'Noch nicht konfiguriert')}
            </p>
          </div>
          {configured ?
            <>
              <div className="glass-card p-4 text-sm">
                <p className="text-slate-500">Letztes Backup</p>
                <p className="mt-1 text-slate-200">
                  {backups?.lastBackupAt ? formatDateTime(backups.lastBackupAt) : '–'}
                </p>
              </div>
              <div className="glass-card p-4 text-sm">
                <p className="text-slate-500">Nächstes Backup</p>
                <p className="mt-1 text-slate-200">
                  {backups?.nextBackupAt ? formatDateTime(backups.nextBackupAt) : '–'}
                </p>
              </div>
              <div className="glass-card p-4 text-sm md:col-span-2">
                <p className="text-slate-500">Größe letztes Backup</p>
                <p className="mt-1 text-slate-200">
                  {backups?.sizeBytes && backups.sizeBytes > 0 ?
                    `${(backups.sizeBytes / 1024 / 1024).toFixed(2)} MB`
                  : 'Nicht verfügbar'}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Backup-Historie: Wird vorbereitet — benötigt API
                  GET /api/admin/backups/history
                </p>
              </div>
            </>
          : null}
        </div>
      }
    </>
  );
}
