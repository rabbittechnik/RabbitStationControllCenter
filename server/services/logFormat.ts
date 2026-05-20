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
  trial_extended: 'Testzeitraum verlängert',
  trial_extend_failed: 'Testzeitraum-Verlängerung fehlgeschlagen',
  payment_started: 'Kunde hat Zahlung gestartet',
  subscription_manually_activated: 'Abo manuell freigeschaltet',
  payment_failed: 'Zahlung fehlgeschlagen',
  subscription_plan_changed: 'Plan geändert',
  setup_completed: 'Setup abgeschlossen',
  tour_completed: 'Einführung abgeschlossen',
};

function planLabelShort(plan: string): string {
  const p = plan.toLowerCase().replace(/-/g, '_');
  if (p === 'starter') return 'Starter';
  if (p === 'pro') return 'Pro';
  if (p === 'multi_station') return 'Multi-Station';
  return plan;
}

export function formatLogMessage(action: string, meta: LogMeta): string {
  const key = action.trim().toLowerCase();
  const parts: string[] = [formatLogAction(action)];

  if (key === 'payment_started') {
    if (meta.requestedPlan) parts.push(`Plan: ${planLabelShort(meta.requestedPlan)}`);
    if (meta.paymentProvider) parts.push(`Anbieter: ${meta.paymentProvider === 'sumup' ? 'SumUp' : meta.paymentProvider}`);
    if (meta.userEmail) parts.push(meta.userEmail);
  } else if (key === 'subscription_manually_activated') {
    if (meta.plan) parts.push(`Plan: ${planLabelShort(meta.plan)}`);
    if (meta.paymentProvider) parts.push(`Anbieter: ${meta.paymentProvider === 'sumup' ? 'SumUp' : meta.paymentProvider}`);
    if (meta.paymentReference) parts.push(meta.paymentReference);
    if (meta.source) parts.push(`Quelle: ${meta.source}`);
  } else if (key === 'payment_failed') {
    if (meta.paymentReference) parts.push(meta.paymentReference);
    if (meta.safeMessage) parts.push(meta.safeMessage);
  } else if (key === 'trial_extended') {
    if (meta.daysAdded != null) parts.push(`+${meta.daysAdded} Tage`);
    if (meta.newTrialEnd) parts.push(`bis ${meta.newTrialEnd.slice(0, 10)}`);
    if (meta.note) parts.push(meta.note);
  }

  return parts.filter(Boolean).join(' · ');
}

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
  oldTrialEnd?: string;
  newTrialEnd?: string;
  daysAdded?: number;
  reason?: string;
  note?: string;
  source?: string;
  plan?: string;
  requestedPlan?: string;
  oldPlan?: string;
  paymentProvider?: string;
  paymentStatus?: string;
  paymentReference?: string;
  paymentUrlKey?: string;
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
      oldTrialEnd:
        typeof m.oldTrialEnd === 'string' ? m.oldTrialEnd
        : typeof m.old_trial_end === 'string' ? m.old_trial_end
        : undefined,
      newTrialEnd:
        typeof m.newTrialEnd === 'string' ? m.newTrialEnd
        : typeof m.new_trial_end === 'string' ? m.new_trial_end
        : undefined,
      daysAdded:
        typeof m.daysAdded === 'number' ? m.daysAdded
        : typeof m.days_added === 'number' ? m.days_added
        : undefined,
      reason: typeof m.reason === 'string' ? m.reason : undefined,
      note: typeof m.note === 'string' ? m.note : undefined,
      source: typeof m.source === 'string' ? m.source : undefined,
      plan: typeof m.plan === 'string' ? m.plan : undefined,
      requestedPlan:
        typeof m.requestedPlan === 'string' ? m.requestedPlan
        : typeof m.requested_plan === 'string' ? m.requested_plan
        : undefined,
      oldPlan: typeof m.oldPlan === 'string' ? m.oldPlan : undefined,
      paymentProvider:
        typeof m.paymentProvider === 'string' ? m.paymentProvider
        : typeof m.payment_provider === 'string' ? m.payment_provider
        : undefined,
      paymentStatus:
        typeof m.paymentStatus === 'string' ? m.paymentStatus
        : typeof m.payment_status === 'string' ? m.payment_status
        : undefined,
      paymentReference:
        typeof m.paymentReference === 'string' ? m.paymentReference
        : typeof m.payment_reference === 'string' ? m.payment_reference
        : undefined,
      paymentUrlKey:
        typeof m.paymentUrlKey === 'string' ? m.paymentUrlKey
        : typeof m.payment_url_key === 'string' ? m.payment_url_key
        : undefined,
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

    const paymentDetail =
      meta.paymentReference ??
      (meta.requestedPlan ? `Gewünscht: ${planLabelShort(meta.requestedPlan)}` : undefined);
    const subline =
      paymentDetail ??
      tenantOperator ??
      (r.tenant_id ? undefined : 'Systemweit');

    return {
      id: typeof r.id === 'number' ? r.id : i + 1,
      tenant_id: r.tenant_id ?? null,
      user_id: r.user_id ?? null,
      severity: severityForAction(action),
      category: r.entity_type ?? 'audit',
      action,
      action_label: formatLogAction(action),
      message: formatLogMessage(action, meta),
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
      trial_old_end: meta.oldTrialEnd,
      trial_new_end: meta.newTrialEnd,
      trial_days_added: meta.daysAdded,
      trial_extend_reason: meta.reason,
      trial_extend_note: meta.note,
      trial_extend_source: meta.source,
      trial_extend_plan: meta.plan,
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
