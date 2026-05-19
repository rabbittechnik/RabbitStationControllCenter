/** Nutzerfreundliche Fehlermeldung — keine rohen JS-Property-Fehler in der UI. */
export function sanitizeUserFacingError(message: string | undefined | null): string {
  const raw = (message ?? '').trim();
  if (!raw) return 'Statusdaten konnten nicht vollständig geladen werden.';
  if (/cannot read propert(y|ies) of undefined/i.test(raw)) {
    return 'Statusdaten konnten nicht vollständig geladen werden.';
  }
  if (/cannot read propert(y|ies) of null/i.test(raw)) {
    return 'Statusdaten konnten nicht vollständig geladen werden.';
  }
  return raw;
}

export function isTechnicalMappingError(message: string): boolean {
  return message.includes('Health-Daten nicht verarbeiten') || message.includes('Statusdaten nicht verarbeiten');
}
