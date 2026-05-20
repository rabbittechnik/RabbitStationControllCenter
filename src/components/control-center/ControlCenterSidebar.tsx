import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Building2,
  CreditCard,
  FileText,
  Cloud,
  Shield,
  Headphones,
  Settings,
  Rabbit,
} from 'lucide-react';
import { CC_NAV, CC_ROUTES, type CcRouteKey } from '../../control-center/routes';

const icons: Record<CcRouteKey, typeof LayoutDashboard> = {
  overview: LayoutDashboard,
  system: Activity,
  tenants: Building2,
  abos: CreditCard,
  logs: FileText,
  backups: Cloud,
  security: Shield,
  support: Headphones,
  settings: Settings,
};

interface ControlCenterSidebarProps {
  collapsed?: boolean;
  frontendConnected?: boolean;
  serverApiConnected?: boolean;
  onNavigate?: () => void;
}

export function ControlCenterSidebar({
  collapsed,
  frontendConnected,
  serverApiConnected,
  onNavigate,
}: ControlCenterSidebarProps) {
  return (
    <aside
      className={`flex h-full flex-col border-r border-white/5 bg-navy-900/95 ${
        collapsed ? 'w-16' : 'w-56'
      } shrink-0 transition-all duration-300`}
    >
      <div className="border-b border-white/5 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-cyan/10 text-neon-cyan shadow-glow">
            <Rabbit className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neon-cyan">
                Rabbit-Station
              </p>
              <p className="text-xs font-medium leading-tight text-slate-300">Control Center</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {CC_NAV.map((item) => {
          const Icon = icons[item.key];
          return (
            <NavLink
              key={item.key}
              to={CC_ROUTES[item.key]}
              end={item.key === 'overview'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                  isActive ?
                    'sidebar-active font-medium text-neon-cyan shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <SidebarFooter
          frontendConnected={frontendConnected}
          serverApiConnected={serverApiConnected}
        />
      )}
    </aside>
  );
}

function connectionLine(connected?: boolean) {
  if (connected === true) return { text: 'verbunden', className: 'text-neon-green' };
  if (connected === false) return { text: 'getrennt', className: 'text-neon-orange' };
  return { text: 'unbekannt', className: 'text-slate-500' };
}

function SidebarFooter({
  frontendConnected,
  serverApiConnected,
}: {
  frontendConnected?: boolean;
  serverApiConnected?: boolean;
}) {
  const fe = connectionLine(frontendConnected);
  const api = connectionLine(serverApiConnected);

  return (
    <div className="border-t border-white/5 p-3 text-[10px] text-slate-500">
      <p className="font-medium text-slate-400">Verbindung</p>
      <p>
        Frontend: <span className={fe.className}>{fe.text}</span>
      </p>
      <p>
        Server/API: <span className={api.className}>{api.text}</span>
      </p>
      <p className="mt-2 text-slate-600">Control Center · Live-Daten</p>
    </div>
  );
}
