import type { ApiFail } from '../api/client';

export const SUBSCRIPTION_SUCCESS = 'Plan wurde aktualisiert.';
export const SUBSCRIPTION_FAIL = 'Plan konnte nicht geändert werden.';
export const SUBSCRIPTION_FORBIDDEN = 'Keine Berechtigung für Abo-Änderung.';
export const SUBSCRIPTION_UNREACHABLE = 'Haupt-App nicht erreichbar.';

export function subscriptionErrorMessage(result: ApiFail): string {
  const code = result.code ?? result.error;
  if (code === 'unauthorized' || code === 'forbidden') {
    return SUBSCRIPTION_FORBIDDEN;
  }
  if (
    code === 'network_error' ||
    code === 'timeout' ||
    result.message.includes('nicht erreichbar') ||
    result.message.includes('502')
  ) {
    return SUBSCRIPTION_UNREACHABLE;
  }
  if (result.message.includes('Berechtigung')) {
    return SUBSCRIPTION_FORBIDDEN;
  }
  return result.message || SUBSCRIPTION_FAIL;
}
