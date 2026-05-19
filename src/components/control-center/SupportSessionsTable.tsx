import { ExternalLink, Eye, Square } from 'lucide-react';
import type { SupportSession } from '../../types';
import {
  formatSupportDateTime,
  formatSupportRemaining,
  supportAccessModeLabel,
  supportStatusLabel,
} from '../../utils/supportSessions';

interface SupportSessionsTableProps {
  sessions: SupportSession[];
  emptyMessage?: string;
  impersonationUrls: Record<string, string>;
  onOpen: (session: SupportSession) => void;
  onEnd: (session: SupportSession) => void;
  onDetails: (session: SupportSession) => void;
}

function statusClass(status: SupportSession['status']): string {
  switch (status) {
    case 'active':
      return 'text-neon-green';
    case 'expired':
      return 'text-neon-orange';
    case 'revoked':
      return 'text-red-300';
    default:
      return 'text-slate-400';
  }
}

export function SupportSessionsTable({
  sessions,
  emptyMessage,
  impersonationUrls,
  onOpen,
  onEnd,
  onDetails,
}: SupportSessionsTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-sm text-slate-500">
        {emptyMessage ?? 'Keine Support-Sitzungen vorhanden.'}
      </div>
    );
  }

  return (
    <div className="glass-card overflow-x-auto">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs text-slate-500">
            <th className="px-4 py-3 font-medium">Tenant / Firma</th>
            <th className="px-4 py-3 font-medium">Station</th>
            <th className="px-4 py-3 font-medium">Admin</th>
            <th className="px-4 py-3 font-medium">Grund</th>
            <th className="px-4 py-3 font-medium">Modus</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Startzeit</th>
            <th className="px-4 py-3 font-medium">Ablaufzeit</th>
            <th className="px-4 py-3 font-medium">Restzeit</th>
            <th className="px-4 py-3 font-medium">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => {
            const openUrl = impersonationUrls[s.id];
            const canOpen = s.status === 'active' && Boolean(openUrl);
            return (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-white">{s.tenantName}</td>
                <td className="px-4 py-3 text-slate-300">{s.stationName ?? '–'}</td>
                <td className="px-4 py-3 text-slate-300">{s.adminEmail ?? '–'}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-slate-300" title={s.reason}>
                  {s.reason}
                </td>
                <td className="px-4 py-3 text-slate-300">{supportAccessModeLabel(s.accessMode)}</td>
                <td className={`px-4 py-3 font-medium ${statusClass(s.status)}`}>
                  {supportStatusLabel(s.status)}
                </td>
                <td className="px-4 py-3 text-slate-400">{formatSupportDateTime(s.startedAt)}</td>
                <td className="px-4 py-3 text-slate-400">{formatSupportDateTime(s.expiresAt)}</td>
                <td className="px-4 py-3 text-slate-300">
                  {formatSupportRemaining(s.expiresAt, s.status)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={!canOpen}
                      title={
                        canOpen ?
                          'Haupt-App im Support-Modus öffnen'
                        : 'Link nur direkt nach dem Start verfügbar'
                      }
                      onClick={() => onOpen(s)}
                      className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-neon-cyan hover:bg-neon-cyan/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ExternalLink className="h-3 w-3" />
                      öffnen
                    </button>
                    {s.status === 'active' ?
                      <button
                        type="button"
                        onClick={() => onEnd(s)}
                        className="inline-flex items-center gap-1 rounded border border-neon-orange/30 px-2 py-1 text-xs text-neon-orange hover:bg-neon-orange/10"
                      >
                        <Square className="h-3 w-3" />
                        beenden
                      </button>
                    : null}
                    <button
                      type="button"
                      onClick={() => onDetails(s)}
                      className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5"
                    >
                      <Eye className="h-3 w-3" />
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
