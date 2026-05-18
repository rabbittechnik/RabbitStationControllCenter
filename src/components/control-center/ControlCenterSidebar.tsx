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
  ChevronDown,
  Rabbit,
} from 'lucide-react';
import { MiniSparkline } from './MiniSparkline';

const navItems = [
  { id: 'overview', label: 'Übersicht', icon: LayoutDashboard, active: true },
  { id: 'system', label: 'Systemstatus', icon: Activity },
  { id: 'tenants', label: 'Tenants', icon: Building2, chevron: true },
  { id: 'subscriptions', label: 'Abos', icon: CreditCard },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'backups', label: 'Backups', icon: Cloud, chevron: true },
  { id: 'security', label: 'Sicherheit', icon: Shield },
  { id: 'support', label: 'Support-Zugriffe', icon: Headphones },
  { id: 'settings', label: 'Einstellungen', icon: Settings, chevron: true },
];

interface ControlCenterSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function ControlCenterSidebar({ collapsed }: ControlCenterSidebarProps) {
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
              <p className="text-xs font-medium leading-tight text-slate-300">
                Control Center
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                item.active ? 'sidebar-active font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.chevron && <ChevronDown className="h-3.5 w-3.5 opacity-50" />}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="space-y-3 border-t border-white/5 p-3">
          <div className="glass-card p-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-neon-green shadow-[0_0_8px_#00e676]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neon-green">System läuft stabil</p>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
                  Alle Kernservices sind online und performant.
                </p>
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <MiniSparkline color="#00e676" />
            </div>
          </div>

          <div className="px-1 text-[10px] text-slate-500">
            <p className="font-medium text-slate-400">RabbitStation Pro</p>
            <p>v2.3.0 · Build 5621</p>
            <span className="mt-1 inline-block rounded bg-neon-green/15 px-1.5 py-0.5 text-[9px] font-semibold text-neon-green">
              Aktuell
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
