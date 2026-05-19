import { rabbitStationPost, RabbitStationApiError } from './rabbitStationApiClient.js';

const RESEND_REASON = 'Manuell aus Control Center erneut gesendet';

type ResendWelcomeApiSuccess = {
  ok: true;
  message?: string;
};

type ResendWelcomeApiFailure = {
  ok: false;
  error?: string;
  message?: string;
  details?: { safeMessage?: string };
};

export function mapResendWelcomeEmailUserMessage(code: string, fallback?: string): string {
  switch (code) {
    case 'rate_limit':
      return 'Für diesen Benutzer wurden heute bereits mehrere Willkommens-E-Mails versendet.';
    case 'smtp_not_available':
      return 'Mailversand ist aktuell nicht bereit.';
    case 'tenant_not_found':
    case 'user_not_found':
      return 'Benutzer konnte nicht gefunden werden.';
    case 'missing_email':
      return 'Für diesen Benutzer ist keine E-Mail-Adresse hinterlegt.';
    case 'timeout':
    case 'network_error':
      return 'Haupt-App nicht erreichbar.';
    case 'config_missing':
      return 'Haupt-App nicht verbunden.';
    case 'unauthorized':
    case 'forbidden':
      return 'Keine Berechtigung für diesen Vorgang.';
    default:
      return fallback?.trim() || 'Willkommens-E-Mail konnte nicht gesendet werden.';
  }
}

export function resendWelcomeEmailHttpStatus(code: string, httpStatus?: number): number {
  if (code === 'config_missing') return 503;
  if (code === 'unauthorized' || code === 'forbidden') return httpStatus ?? 403;
  if (code === 'timeout' || code === 'network_error') return 502;
  if (code === 'rate_limit') return 429;
  if (code === 'tenant_not_found' || code === 'user_not_found') return 404;
  if (code === 'missing_email') return 400;
  if (httpStatus && httpStatus >= 400 && httpStatus < 600) return httpStatus;
  return 502;
}

export async function resendLiveWelcomeEmail(
  tenantId: string,
  userId: string,
): Promise<{ message: string }> {
  const path = `/api/admin/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}/resend-welcome-email`;
  const raw = await rabbitStationPost<ResendWelcomeApiSuccess | ResendWelcomeApiFailure>(path, {
    reason: RESEND_REASON,
  });

  if (raw && typeof raw === 'object' && 'ok' in raw && raw.ok === false) {
    const code = raw.error ?? 'mail_send_failed';
    const detail = raw.details?.safeMessage;
    const msg = mapResendWelcomeEmailUserMessage(code, raw.message ?? detail);
    throw new RabbitStationApiError(msg, code);
  }

  const message =
    raw && typeof raw === 'object' && 'message' in raw && typeof raw.message === 'string'
      ? raw.message
      : 'Willkommens-E-Mail wurde erneut gesendet.';
  return { message };
}
