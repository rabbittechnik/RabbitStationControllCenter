const TIMEOUT_MS = 10_000;

export type RabbitStationConfig =
  | { ready: true; baseUrl: string; token: string }
  | { ready: false; error: string };

export class RabbitStationApiError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = 'RabbitStationApiError';
    this.code = code;
    this.status = status;
  }
}

export function getRabbitStationConfig(): RabbitStationConfig {
  const baseUrl = process.env.RABBITSTATION_API_URL?.trim().replace(/\/$/, '');
  const token = process.env.CONTROL_CENTER_API_TOKEN?.trim();

  if (!baseUrl) {
    return { ready: false, error: 'RabbitStation API URL ist nicht konfiguriert.' };
  }
  if (!token) {
    return { ready: false, error: 'Control-Center API Token fehlt.' };
  }
  return { ready: true, baseUrl, token };
}

type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

export async function rabbitStationFetch<T>(apiPath: string): Promise<T> {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) {
    throw new RabbitStationApiError(cfg.error, 'config_missing');
  }

  const url = `${cfg.baseUrl}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    const text = await res.text();
    let json: ApiEnvelope<T> | Record<string, unknown> | null = null;
    try {
      json = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
    } catch {
      throw new RabbitStationApiError('Ungültige JSON-Antwort der Haupt-App.', 'invalid_json', res.status);
    }

    if (!res.ok) {
      const errMsg =
        json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string'
          ? String((json as { error: string }).error)
          : `HTTP ${res.status}`;
      if (res.status === 401) {
        throw new RabbitStationApiError(
          'Haupt-App hat den API-Token abgelehnt (401). Token prüfen oder in der Haupt-App Service-Auth aktivieren.',
          'unauthorized',
          401,
        );
      }
      if (res.status === 403) {
        throw new RabbitStationApiError('Keine Berechtigung auf der Haupt-App (403).', 'forbidden', 403);
      }
      if (res.status >= 500) {
        throw new RabbitStationApiError(`Haupt-App-Fehler: ${errMsg}`, 'server_error', res.status);
      }
      throw new RabbitStationApiError(errMsg, 'http_error', res.status);
    }

    if (json && typeof json === 'object' && 'ok' in json) {
      const envelope = json as ApiEnvelope<T>;
      if (envelope.ok === false) {
        throw new RabbitStationApiError(envelope.error ?? 'API-Fehler', 'api_error');
      }
      return envelope.data;
    }

    return json as T;
  } catch (e) {
    if (e instanceof RabbitStationApiError) throw e;
    if (e instanceof Error && e.name === 'AbortError') {
      throw new RabbitStationApiError(
        'Haupt-App nicht erreichbar (Zeitüberschreitung).',
        'timeout',
      );
    }
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
    throw new RabbitStationApiError(
      `Haupt-App nicht erreichbar: ${msg}`,
      'network_error',
    );
  } finally {
    clearTimeout(timer);
    void started;
  }
}
