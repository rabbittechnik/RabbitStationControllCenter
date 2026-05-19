import type { SystemLog } from '../types';

const WELCOME_EMAIL_RESEND_ACTIONS = new Set([
  'registration_welcome_email_failed',
  'registration_welcome_email_resend_failed',
]);

export function isWelcomeEmailResendLogAction(action: string): boolean {
  return WELCOME_EMAIL_RESEND_ACTIONS.has(action.trim().toLowerCase());
}

export function showWelcomeEmailResendControl(log: SystemLog): boolean {
  return isWelcomeEmailResendLogAction(log.action);
}

export function welcomeEmailResendTarget(log: SystemLog): {
  tenantId: string | null;
  userId: string | null;
  userEmail: string | null;
} {
  return {
    tenantId: log.tenant_id,
    userId: log.user_id ?? null,
    userEmail: log.user_email ?? null,
  };
}
