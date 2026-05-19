import type { SystemLog, Tenant } from '../types.js';

const ACTION_LABELS: Record<string, string> = {
  registration_completed: 'Registrierung abgeschlossen',
  tenant_created: 'Tenant erstellt',
  login_success: 'Login erfolgreich',
  login_failed: 'Login fehlgeschlagen',
  registration_welcome_email_failed: 'Willkommens-E-Mail konnte nicht gesendet werden',
  registration_welcome_email_sent: 'Willkommens-E-Mail gesendet',
  backup_success: 'Backup erfolgreich',
  backup_failed: 'Backup fehlgeschlagen',
  subscription_changed: 'Abo geändert',
  'subscription.changed': 'Abo geändert',
  setup_completed: 'Setup abgeschlossen',
  tour_completed: 'Einführung abgeschlossen',
};

export function formatLogAction(action: string): string {
  const key = action.trim().toLowerCase();
  if (ACTION_LABELS[key]) return ACTION_LABELS[key];
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];

  return action
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function severityForAction(action: string): SystemLog['severity'] {
  const a = action.toLowerCase();
  if (a.includes('failed') || a.includes('blocked') || a.includes('denied') || a.includes('error')) {
    return 'error';
  }
  if (a.includes('expired') || a.includes('past_due')) {
    return 'warning';
  }
  if (a.includes('success') || a.includes('completed') || a.includes('created')) {
    return 'success';
  }
  return 'info';
}

type RawLog = {
  id: string | number;
  tenant_id?: string | null;
  user_id?: string | null;
  action?: string;
  entity_type?: string | null;
  metadata_json?: string | null;
  created_at?: string;
};

type LogMeta = {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  companyName?: string;
};

function parseMetadata(raw?: string | null): LogMeta {
  if (!raw?.trim()) return {};
  try {
    const m = JSON.parse(raw) as Record<string, unknown>;
    return {
      userName:
        typeof m.userName === 'string' ? m.userName
        : typeof m.name === 'string' ? m.name
        : undefined,
      userEmail:
        typeof m.userEmail === 'string' ? m.userEmail
        : typeof m.email === 'string' ? m.email
        : undefined,
      userRole: typeof m.role === 'string' ? m.role : undefined,
      companyName: typeof m.companyName === 'string' ? m.companyName : undefined,
    };
  } catch {
    return {};
  }
}

function tenantLookup(tenants: Tenant[], tenantId: string | null | undefined) {
  if (!tenantId) return null;
  return tenants.find((t) => t.id === tenantId) ?? null;
}

export function enrichLogs(rows: RawLog[], tenants: Tenant[]): SystemLog[] {
  return rows.map((r, i) => {
    const action = r.action ?? 'event';
    const meta = parseMetadata(r.metadata_json);
    const tenant = tenantLookup(tenants, r.tenant_id);

    const tenantName = tenant?.name ?? meta.companyName ?? null;
    const tenantSlug = tenant?.slug ?? null;
    const tenantOperator = tenant?.operator ?? meta.userEmail ?? null;

    const userLabel =
      meta.userName ??
      meta.userEmail ??
      (r.user_id ? 'Unbekannter Benutzer' : null);

    const headline =
      tenantName ?
        tenantSlug ?
          `${tenantName} · ${tenantSlug}`
        : tenantName
      : r.tenant_id ?
        'Unbekannter Tenant'
      : 'Plattform';

    const subline = tenantOperator ?? (r.tenant_id ? undefined : 'Systemweit');

    return {
      id: typeof r.id === 'number' ? r.id : i + 1,
      tenant_id: r.tenant_id ?? null,
      user_id: r.user_id ?? null,
      severity: severityForAction(action),
      category: r.entity_type ?? 'audit',
      action,
      action_label: formatLogAction(action),
      message: formatLogAction(action),
      tenant_name: tenantName ?? undefined,
      tenant_slug: tenantSlug ?? undefined,
      tenant_operator: tenantOperator ?? undefined,
      user_name: meta.userName,
      user_email: meta.userEmail,
      user_role: meta.userRole,
      user_label: userLabel ?? undefined,
      headline,
      subline,
      created_at: r.created_at ?? new Date().toISOString(),
    };
  });
}

export function applyTenantActivityFromLogs(tenants: Tenant[], logs: SystemLog[]): Tenant[] {
  const latestByTenant = new Map<string, string>();
  for (const log of logs) {
    if (!log.tenant_id || !log.created_at) continue;
    const prev = latestByTenant.get(log.tenant_id);
    if (!prev || log.created_at > prev) {
      latestByTenant.set(log.tenant_id, log.created_at);
    }
  }

  return tenants.map((t) => {
    const iso = latestByTenant.get(t.id);
    if (!iso) {
      return { ...t, last_activity_at: null, last_activity_minutes: null };
    }
    const ms = Date.now() - new Date(iso).getTime();
    const minutes = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 60_000)) : null;
    return {
      ...t,
      last_activity_at: iso,
      last_activity_minutes: minutes,
    };
  });
}

export function hasRecentMailFailure(logs: SystemLog[], withinHours = 48): boolean {
  const cutoff = Date.now() - withinHours * 3600_000;
  return logs.some((l) => {
    const a = l.action.toLowerCase();
    if (!a.includes('mail') && !a.includes('email') && !a.includes('smtp')) return false;
    if (!a.includes('fail')) return false;
    const t = new Date(l.created_at).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}
