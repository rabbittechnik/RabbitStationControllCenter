export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  const date = d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${date} · ${time}`;
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  return d.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTrialEnd(date: string | null): string {
  if (!date) return '–';
  return new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const INVALID_ACTIVITY_MINUTES = 99_999;

export function formatRelativeActivity(
  minutes: number | null | undefined,
  iso?: string | null,
): string {
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      return formatRelativeFromDate(d);
    }
  }

  if (minutes == null || !Number.isFinite(minutes) || minutes >= INVALID_ACTIVITY_MINUTES) {
    return 'Noch keine Aktivität';
  }

  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return minutes === 1 ? 'vor 1 Min.' : `vor ${minutes} Min.`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'vor 1 Std.' : `vor ${hours} Std.`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;

  return formatDateTime(iso ?? new Date(Date.now() - minutes * 60_000).toISOString()).split(' ·')[0];
}

function formatRelativeFromDate(d: Date): string {
  const ms = Date.now() - d.getTime();
  if (ms < 60_000) return 'gerade eben';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return minutes === 1 ? 'vor 1 Min.' : `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'vor 1 Std.' : `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** @deprecated Use formatRelativeActivity */
export function activityLabel(minutes: number | null | undefined): string {
  return formatRelativeActivity(minutes);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function overallStatusLabel(
  status?: string,
  overallLabel?: string,
): string {
  if (overallLabel === 'partial') return 'Teilweise konfiguriert';
  if (status === 'ok') return 'Operational';
  if (status === 'warning') return 'Warnung';
  if (status === 'unknown') return 'Unbekannt';
  return 'Störung';
}
