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

export function technicalDetailLabel(message: string | undefined | null): string | undefined {
  const raw = (message ?? '').trim();
  if (!raw) return undefined;
  if (/cannot read propert/i.test(raw)) return raw;
  if (raw.includes('Health-Daten nicht verarbeiten')) return raw;
  return undefined;
}
