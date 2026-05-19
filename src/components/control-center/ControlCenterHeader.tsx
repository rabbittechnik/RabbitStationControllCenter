import { Search, Globe, RefreshCw, Menu } from 'lucide-react';
import { formatDateTime, getInitials } from '../../utils/format';
import type { SessionUser } from '../../types';
import { LiveSignalBars } from './LiveSignalBars';

interface ControlCenterHeaderProps {
  user: SessionUser;
  serverTime?: string;
  overallStatus?: string;
  search: string;
  onSearchChange: (v: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
  onMenuClick?: () => void;
}

export function ControlCenterHeader({
  user,
  serverTime,
  overallStatus = 'ok',
  search,
  onSearchChange,
  onRefresh,
  refreshing,
  onMenuClick,
}: ControlCenterHeaderProps) {
  const statusLabel =
    overallStatus === 'ok' ? 'Operational'
    : overallStatus === 'warning' ? 'Warnung'
    : overallStatus === 'unknown' ? 'Unbekannt'
    : 'Störung';

  const statusColor =
    overallStatus === 'ok' ? 'text-neon-green'
    : overallStatus === 'warning' ? 'text-neon-orange'
    : overallStatus === 'unknown' ? 'text-slate-400'
    : 'text-neon-red';

  return (
    <header className="border-b border-white/5 bg-navy-900/50 px-4 py-4 lg:px-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-white lg:text-xl">
            RabbitStation Control Center
          </h1>
          <p className="text-xs text-slate-500">SaaS-Überwachung & Systemstatus</p>
        </div>

        <div className="relative hidden w-64 md:block lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Suche (Tenants, Nutzer, Logs, ...)"
            className="w-full rounded-lg border border-white/10 bg-navy-850 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-neon-cyan/40 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-slate-500">Alle Systeme</span>
            <span className={`flex items-center gap-1.5 font-medium ${statusColor}`}>
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${
                    overallStatus === 'ok' ? 'bg-neon-green' : overallStatus === 'warning' ? 'bg-neon-orange' : 'bg-neon-red'
                  }`}
                />
                <span
                  className={`relative h-2 w-2 rounded-full ${
                    overallStatus === 'ok' ? 'bg-neon-green' : overallStatus === 'warning' ? 'bg-neon-orange' : 'bg-neon-red'
                  }`}
                />
              </span>
              {statusLabel}
            </span>
          </div>

          <div className="hidden items-center gap-1.5 text-slate-400 md:flex">
            <Globe className="h-3.5 w-3.5 text-neon-cyan" />
            EU-Central
          </div>

          <LiveSignalBars />

          <span className="hidden whitespace-nowrap text-slate-500 lg:inline">
            {serverTime ? formatDateTime(serverTime) : '–'}
          </span>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-neon-cyan disabled:opacity-50"
            title="Health-Check aktualisieren"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-navy-850 px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-cyan/10 text-xs font-bold text-neon-cyan">
              {getInitials(user.name)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-200">{user.name}</p>
              <p className="text-[10px] text-slate-500">Plattform-Owner</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
