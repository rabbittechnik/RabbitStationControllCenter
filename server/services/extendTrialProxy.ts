import { rabbitStationPost, RabbitStationApiError } from './rabbitStationApiClient.js';

export type ExtendTrialRequestBody = {
  days?: number;
  newTrialEnd?: string;
  reason: string;
  note?: string;
};

type ExtendTrialApiSuccess = {
  ok: true;
  message?: string;
  data?: {
    tenantId?: string;
    tenantName?: string;
    plan?: string;
    subscriptionStatus?: string;
    oldTrialEnd?: string | null;
    newTrialEnd?: string;
    daysAdded?: number;
    remainingDays?: number;
  };
};

type ExtendTrialApiFailure = {
  ok: false;
  error?: string;
  message?: string;
};

export function mapExtendTrialUserMessage(code: string, fallback?: string): string {
  switch (code) {
    case 'tenant_already_active':
      return 'Der Kunde hat bereits ein aktives Abo.';
    case 'reason_required':
      return 'Bitte geben Sie einen Grund für die Verlängerung an.';
    case 'invalid_days':
      return 'Bitte wählen Sie eine gültige Anzahl an Tagen.';
    case 'tenant_not_found':
      return 'Kunde wurde nicht gefunden.';
    case 'tenant_not_eligible':
      return 'Testzeit kann für diesen Kunden derzeit nicht verlängert werden.';
    case 'trial_end_too_far':
      return 'Das gewählte Trial-Ende liegt zu weit in der Zukunft.';
    case 'invalid_body':
    case 'invalid_new_trial_end':
      return fallback?.trim() || 'Die Eingaben sind ungültig.';
    case 'timeout':
    case 'network_error':
      return 'Haupt-App ist aktuell nicht erreichbar.';
    case 'config_missing':
      return 'Haupt-App ist aktuell nicht erreichbar.';
    case 'unauthorized':
    case 'forbidden':
      return 'Keine Berechtigung für diesen Vorgang.';
    default:
      return fallback?.trim() || 'Testzeitraum konnte nicht verlängert werden.';
  }
}

export function extendTrialHttpStatus(code: string, httpStatus?: number): number {
  if (code === 'config_missing') return 503;
  if (code === 'unauthorized' || code === 'forbidden') return httpStatus ?? 403;
  if (code === 'timeout' || code === 'network_error') return 502;
  if (code === 'tenant_not_found') return 404;
  if (code === 'tenant_already_active') return 409;
  if (code === 'tenant_not_eligible') return 403;
  if (code === 'reason_required' || code === 'invalid_days' || code === 'invalid_body') return 400;
  if (httpStatus && httpStatus >= 400 && httpStatus < 600) return httpStatus;
  return 502;
}

export async function extendLiveTrial(
  tenantId: string,
  body: ExtendTrialRequestBody,
): Promise<{
  message: string;
  newTrialEnd: string;
  remainingDays?: number;
}> {
  const path = `/api/admin/tenants/${encodeURIComponent(tenantId)}/trial/extend`;
  const raw = await rabbitStationPost<ExtendTrialApiSuccess | ExtendTrialApiFailure>(path, body);

  if (raw && typeof raw === 'object' && 'ok' in raw && raw.ok === false) {
    const code = raw.error ?? 'trial_extend_failed';
    const msg = mapExtendTrialUserMessage(code, raw.message);
    throw new RabbitStationApiError(msg, code);
  }

  const data = raw && typeof raw === 'object' && 'data' in raw ? raw.data : undefined;
  const newTrialEnd = data?.newTrialEnd;
  if (!newTrialEnd) {
    throw new RabbitStationApiError(
      'Ungültige Antwort der Haupt-App.',
      'invalid_response',
    );
  }

  const message =
    raw && typeof raw === 'object' && 'message' in raw && typeof raw.message === 'string'
      ? raw.message
      : 'Testzeitraum wurde verlängert.';

  return {
    message,
    newTrialEnd,
    remainingDays: data?.remainingDays,
  };
}
