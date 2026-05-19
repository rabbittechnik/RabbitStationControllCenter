import type { SystemLog } from '../types';

export type LogSeverityFilter = 'all' | 'info' | 'success' | 'warning' | 'error' | 'critical';
export type LogCategoryFilter =
  | 'all'
  | 'login'
  | 'registration'
  | 'mail'
  | 'tenant'
  | 'abo'
  | 'backup'
  | 'security';

function matchesCategory(action: string, category: LogCategoryFilter): boolean {
  const a = action.toLowerCase();
  switch (category) {
    case 'login':
      return a.includes('login');
    case 'registration':
      return a.includes('registration') || a.includes('register');
    case 'mail':
      return a.includes('mail') || a.includes('email') || a.includes('smtp');
    case 'tenant':
      return a.includes('tenant');
    case 'abo':
      return a.includes('subscription') || a.includes('trial') || a.includes('plan');
    case 'backup':
      return a.includes('backup');
    case 'security':
      return (
        a.includes('block') ||
        a.includes('denied') ||
        a.includes('failed') ||
        a.includes('role') ||
        a.includes('support')
      );
    default:
      return true;
  }
}

export function filterLogs(
  logs: SystemLog[],
  opts: {
    severity: LogSeverityFilter;
    category: LogCategoryFilter;
    search: string;
    tenantId?: string | null;
  },
): SystemLog[] {
  const q = opts.search.trim().toLowerCase();
  return logs.filter((log) => {
    if (opts.tenantId && log.tenant_id !== opts.tenantId) return false;
    if (opts.severity !== 'all' && log.severity !== opts.severity) return false;
    if (opts.category !== 'all' && !matchesCategory(log.action, opts.category)) return false;
    if (!q) return true;
    const hay = [
      log.headline,
      log.subline,
      log.tenant_name,
      log.tenant_slug,
      log.tenant_operator,
      log.user_label,
      log.user_email,
      log.action,
      log.action_label,
      log.message,
      log.category,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
