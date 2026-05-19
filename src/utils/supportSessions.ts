import type { SupportAccessMode, SupportSession, SupportSessionStatus } from '../types';

export function supportStatusLabel(status: SupportSessionStatus): string {
  switch (status) {
    case 'active':
      return 'Aktiv';
    case 'ended':
      return 'Beendet';
    case 'expired':
      return 'Abgelaufen';
    case 'revoked':
      return 'Widerrufen';
    default:
      return status;
  }
}

export function supportAccessModeLabel(mode: SupportAccessMode): string {
  return mode === 'support_write' ? 'Support mit Bearbeitung' : 'Nur lesen';
}

export function formatSupportDateTime(iso: string | null | undefined): string {
  if (!iso) return '–';
  try {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatSupportRemaining(expiresAt: string, status: SupportSessionStatus): string {
  if (status !== 'active') return '–';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'abgelaufen';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min} Min.`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

export function isStartedToday(startedAt: string): boolean {
  const d = new Date(startedAt);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function supportSessionStats(sessions: SupportSession[]) {
  return {
    active: sessions.filter((s) => s.status === 'active').length,
    startedToday: sessions.filter((s) => isStartedToday(s.startedAt)).length,
    expired: sessions.filter((s) => s.status === 'expired').length,
    ended: sessions.filter((s) => s.status === 'ended').length,
  };
}

export function supportApiErrorMessage(
  result: { code?: string; message: string },
): string {
  if (result.code === 'unauthorized' || result.code === 'forbidden') {
    return 'Keine Berechtigung für Support-Zugriffe.';
  }
  if (result.code === 'network_error' || result.message.includes('nicht erreichbar')) {
    return 'Haupt-App nicht erreichbar.';
  }
  return result.message;
}
