/** Verhindert React error #31 — Objekte werden nicht direkt gerendert. */
export function safeText(value: unknown, fallback = 'Nicht verfügbar'): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim() || fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message.trim()) return o.message;
    if (typeof o.status === 'string') return o.status;
    if (typeof o.connections === 'number') return `${o.connections} Verbindungen`;
  }
  return fallback;
}

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}
