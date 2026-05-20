import type { Tenant } from '../types';

/** Trial kann verlängert werden (trial, abgelaufene Trial, bald ablaufend). */
export function canExtendTrial(tenant: Tenant): boolean {
  const status = tenant.status?.toLowerCase() ?? '';
  if (status === 'active' || status === 'cancelled' || status === 'suspended' || status === 'blocked') {
    return false;
  }
  if (status === 'expired') return true;
  if (status === 'trial') return true;
  if (status === 'past_due') return false;
  return tenant.trial_end != null;
}

export function extendTrialDisabledReason(tenant: Tenant): string | null {
  const status = tenant.status?.toLowerCase() ?? '';
  if (status === 'active') return 'Kunde hat bereits ein aktives Abo.';
  if (status === 'cancelled') return 'Kunde ist gekündigt.';
  if (status === 'suspended' || status === 'blocked') return 'Kunde ist gesperrt oder ausgesetzt.';
  if (!canExtendTrial(tenant)) return 'Testzeit kann derzeit nicht verlängert werden.';
  return null;
}

export function dateInputToTrialEndIso(dateInput: string): string {
  const trimmed = dateInput.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('T')) return new Date(trimmed).toISOString();
  return new Date(`${trimmed}T23:59:59.000Z`).toISOString();
}

export function trialExtendErrorMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'tenant_already_active':
      return 'Der Kunde hat bereits ein aktives Abo.';
    case 'reason_required':
      return 'Bitte geben Sie einen Grund für die Verlängerung an.';
    case 'invalid_days':
      return 'Bitte wählen Sie eine gültige Anzahl an Tagen.';
    case 'tenant_not_found':
      return 'Kunde wurde nicht gefunden.';
    case 'timeout':
    case 'network_error':
    case 'config_missing':
    case 'api_unavailable':
      return 'Haupt-App ist aktuell nicht erreichbar.';
    default:
      return fallback;
  }
}
