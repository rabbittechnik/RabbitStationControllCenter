const TIMEOUT_MS = 10_000;

export type RabbitStationConfig =
  | { ready: true; baseUrl: string; token: string }
  | { ready: false; error: string; apiUrlSet: boolean; tokenSet: boolean };

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
  const apiUrlSet = Boolean(process.env.RABBITSTATION_API_URL?.trim());
  const tokenSet = Boolean(process.env.CONTROL_CENTER_API_TOKEN?.trim());
  const baseUrl = process.env.RABBITSTATION_API_URL?.trim().replace(/\/$/, '');
  const token = process.env.CONTROL_CENTER_API_TOKEN?.trim();

  if (!apiUrlSet) {
    return {
      ready: false,
      apiUrlSet: false,
      tokenSet,
      error: 'RabbitStation API URL fehlt. Bitte Railway-Variable RABBITSTATION_API_URL setzen.',
    };
  }
  if (!tokenSet) {
    return {
      ready: false,
      apiUrlSet: true,
      tokenSet: false,
      error: 'Control-Center API Token fehlt. Bitte Railway-Variable CONTROL_CENTER_API_TOKEN setzen.',
    };
  }
  return { ready: true, baseUrl: baseUrl!, token: token! };
}

export function getConfigStatusDetails() {
  const cfg = getRabbitStationConfig();
  return {
    apiConfigured: cfg.ready,
    apiUrlSet: cfg.ready ? true : cfg.apiUrlSet,
    tokenSet: cfg.ready ? true : cfg.tokenSet,
    error: cfg.ready ? null : cfg.error,
  };
}

type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

async function rabbitStationRequest<T>(
  apiPath: string,
  init: { method: string; body?: unknown },
): Promise<T> {
  const cfg = getRabbitStationConfig();
  if (!cfg.ready) {
    throw new RabbitStationApiError(cfg.error, 'config_missing');
  }

  const url = `${cfg.baseUrl}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/json',
  };
  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
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
          'Zugriff auf Haupt-App Admin-API verweigert. Token prüfen.',
          'unauthorized',
          401,
        );
      }
      if (res.status === 403) {
        throw new RabbitStationApiError('Zugriff auf Haupt-App Admin-API verweigert (403).', 'forbidden', 403);
      }
      if (res.status === 404) {
        throw new RabbitStationApiError(`Admin-Route nicht gefunden: ${apiPath}`, 'not_found', 404);
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
      throw new RabbitStationApiError('Haupt-App nicht erreichbar (Zeitüberschreitung).', 'timeout');
    }
    const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
    throw new RabbitStationApiError(`Haupt-App nicht erreichbar: ${msg}`, 'network_error');
  } finally {
    clearTimeout(timer);
  }
}

export async function rabbitStationFetch<T>(apiPath: string): Promise<T> {
  return rabbitStationRequest<T>(apiPath, { method: 'GET' });
}

export async function rabbitStationPatch<T>(apiPath: string, body: unknown): Promise<T> {
  return rabbitStationRequest<T>(apiPath, { method: 'PATCH', body });
}
