import type { SystemLog, Tenant } from '../types.js';

const ACTION_LABELS: Record<string, string> = {
  registration_completed: 'Registrierung abgeschlossen',
  tenant_created: 'Tenant erstellt',
  login_success: 'Login erfolgreich',
  login_failed: 'Login fehlgeschlagen',
  registration_welcome_email_failed: 'Willkommens-E-Mail konnte nicht gesendet werden',
  registration_welcome_email_sent: 'Willkommens-E-Mail gesendet',
  registration_welcome_email_resent: 'Willkommens-E-Mail erneut gesendet',
  registration_welcome_email_resend_failed:
    'Willkommens-E-Mail konnte nicht erneut gesendet werden',
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

const WELCOME_EMAIL_RESEND_ACTIONS = new Set([
  'registration_welcome_email_failed',
  'registration_welcome_email_resend_failed',
]);

type LogMeta = {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  companyName?: string;
  tenantName?: string;
  stationName?: string;
  safeMessage?: string;
  errorCode?: string;
};

function parseMetadata(raw?: string | null): LogMeta {
  if (!raw?.trim()) return {};
  try {
    const m = JSON.parse(raw) as Record<string, unknown>;
    const recipientEmail =
      typeof m.recipientEmail === 'string' ? m.recipientEmail
      : typeof m.recipient_email === 'string' ? m.recipient_email
      : undefined;
    return {
      userName:
        typeof m.userName === 'string' ? m.userName
        : typeof m.displayName === 'string' ? m.displayName
        : typeof m.name === 'string' ? m.name
        : undefined,
      userEmail:
        typeof m.userEmail === 'string' ? m.userEmail
        : recipientEmail ?? (typeof m.email === 'string' ? m.email : undefined),
      userRole: typeof m.role === 'string' ? m.role : undefined,
      companyName:
        typeof m.companyName === 'string' ? m.companyName
        : typeof m.tenantName === 'string' ? m.tenantName
        : undefined,
      tenantName: typeof m.tenantName === 'string' ? m.tenantName : undefined,
      stationName: typeof m.stationName === 'string' ? m.stationName : undefined,
      safeMessage: typeof m.safeMessage === 'string' ? m.safeMessage : undefined,
      errorCode: typeof m.errorCode === 'string' ? m.errorCode : undefined,
    };
  } catch {
    return {};
  }
}

export function isWelcomeEmailResendLogAction(action: string): boolean {
  return WELCOME_EMAIL_RESEND_ACTIONS.has(action.trim().toLowerCase());
}

export function welcomeEmailResendState(
  tenantId: string | null | undefined,
  userId: string | null | undefined,
  userEmail: string | undefined,
  action: string,
): { canResend: boolean; disabledReason?: string } {
  if (!isWelcomeEmailResendLogAction(action)) {
    return { canResend: false };
  }
  if (!tenantId?.trim()) {
    return { canResend: false, disabledReason: 'Benutzer konnte nicht eindeutig zugeordnet werden.' };
  }
  if (userId?.trim()) {
    return { canResend: true };
  }
  if (userEmail?.trim()) {
    return { canResend: false, disabledReason: 'Benutzer konnte nicht eindeutig zugeordnet werden.' };
  }
  return { canResend: false, disabledReason: 'Benutzer konnte nicht eindeutig zugeordnet werden.' };
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

    const tenantName = tenant?.name ?? meta.tenantName ?? meta.companyName ?? null;
    const tenantSlug = tenant?.slug ?? null;
    const tenantOperator = tenant?.operator ?? meta.userEmail ?? null;
    const userEmail = meta.userEmail;
    const resend = welcomeEmailResendState(r.tenant_id, r.user_id, userEmail, action);

    const userLabel =
      meta.userName ??
      userEmail ??
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
      user_email: userEmail,
      user_role: meta.userRole,
      user_label: userLabel ?? undefined,
      station_name: meta.stationName,
      error_message: meta.safeMessage,
      error_code: meta.errorCode,
      can_resend_welcome: resend.canResend,
      resend_disabled_reason: resend.disabledReason,
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
