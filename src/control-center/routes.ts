export const CC_BASE = '/admin/control-center';

export const CC_ROUTES = {
  overview: CC_BASE,
  system: `${CC_BASE}/systemstatus`,
  tenants: `${CC_BASE}/tenants`,
  abos: `${CC_BASE}/abos`,
  logs: `${CC_BASE}/logs`,
  backups: `${CC_BASE}/backups`,
  security: `${CC_BASE}/sicherheit`,
  support: `${CC_BASE}/support-zugriffe`,
  settings: `${CC_BASE}/einstellungen`,
} as const;

export type CcRouteKey = keyof typeof CC_ROUTES;

export const CC_NAV: { key: CcRouteKey; label: string }[] = [
  { key: 'overview', label: 'Übersicht' },
  { key: 'system', label: 'Systemstatus' },
  { key: 'tenants', label: 'Tenants' },
  { key: 'abos', label: 'Abos' },
  { key: 'logs', label: 'Logs' },
  { key: 'backups', label: 'Backups' },
  { key: 'security', label: 'Sicherheit' },
  { key: 'support', label: 'Support-Zugriffe' },
  { key: 'settings', label: 'Einstellungen' },
];

/** Aktiven Menüpunkt aus der Browser-URL ermitteln */
export function activeNavKey(pathname: string): CcRouteKey {
  if (pathname === CC_BASE || pathname === `${CC_BASE}/`) return 'overview';
  if (pathname.startsWith(CC_ROUTES.system)) return 'system';
  if (pathname.startsWith(CC_ROUTES.tenants)) return 'tenants';
  if (pathname.startsWith(CC_ROUTES.abos)) return 'abos';
  if (pathname.startsWith(CC_ROUTES.logs)) return 'logs';
  if (pathname.startsWith(CC_ROUTES.backups)) return 'backups';
  if (pathname.startsWith(CC_ROUTES.security)) return 'security';
  if (pathname.startsWith(CC_ROUTES.support)) return 'support';
  if (pathname.startsWith(CC_ROUTES.settings)) return 'settings';
  return 'overview';
}
