import type { HealthConnectivityInfo, HealthStatus } from '../types.js';
import type { MainAppUrls } from './mainAppUrls.js';

const TIMEOUT_MS = 10_000;

export type ConnectivitySnapshot = {
  frontend: HealthConnectivityInfo;
  serverApi: HealthConnectivityInfo;
  checkedAt: string;
};

type HttpProbeResult = {
  ok: boolean;
  httpStatus: number | null;
  responseTimeMs: number;
  bodyText: string;
  contentType: string | null;
  errorCode?: string;
  userMessage: string;
  technicalDetail?: string;
};

function statusFromOk(ok: boolean): HealthStatus {
  return ok ? 'ok' : 'error';
}

function detectRailwayHint(body: string, httpStatus: number | null): string | undefined {
  const lower = body.toLowerCase();
  if (
    lower.includes('no healthy upstream') ||
    lower.includes('application failed to respond') ||
    lower.includes('healthcheck failure') ||
    lower.includes('service crashed')
  ) {
    return 'Möglicherweise ist der Railway-Service abgestürzt oder die Domain ist nicht mit einem aktiven Service verbunden.';
  }
  if (
    httpStatus === 404 &&
    (lower.includes('railway') ||
      lower.includes('not found') ||
      lower.includes('application not found'))
  ) {
    return 'Railway-Domain nicht provisioniert oder falsche Service-Domain.';
  }
  return undefined;
}

function mapFetchError(e: unknown): { errorCode: string; userMessage: string; technicalDetail: string } {
  if (e instanceof Error && e.name === 'AbortError') {
    return {
      errorCode: 'timeout',
      userMessage: 'Zeitüberschreitung beim Verbindungsaufbau.',
      technicalDetail: 'Timeout',
    };
  }
  const msg = e instanceof Error ? e.message : 'fetch failed';
  const lower = msg.toLowerCase();
  if (lower.includes('fetch failed') || lower.includes('econnrefused') || lower.includes('enotfound')) {
    return {
      errorCode: 'network_error',
      userMessage: 'Server/API konnte nicht erreicht werden.',
      technicalDetail: msg,
    };
  }
  return {
    errorCode: 'request_failed',
    userMessage: 'Server/API konnte nicht erreicht werden.',
    technicalDetail: msg,
  };
}

async function httpProbe(
  url: string,
  init?: { headers?: Record<string, string> },
): Promise<HttpProbeResult> {
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: init?.headers ?? { Accept: '*/*' },
      redirect: 'follow',
    });
    const bodyText = await res.text();
    const responseTimeMs = Date.now() - t0;
    const contentType = res.headers.get('content-type');
    const lowerBody = bodyText.toLowerCase();

    if (!res.ok) {
      let userMessage = 'Verbindungsfehler';
      let errorCode = 'http_error';
      if (res.status === 404) {
        userMessage = 'Ressource nicht gefunden (404).';
        errorCode = 'not_found';
      } else if (res.status === 502 || res.status === 503) {
        userMessage = 'Upstream nicht erreichbar.';
        errorCode = 'upstream_error';
      } else if (res.status >= 500) {
        userMessage = 'Serverfehler.';
        errorCode = 'server_error';
      }
      if (lowerBody.includes('no healthy upstream')) {
        userMessage = 'Kein gesunder Upstream (Service offline).';
        errorCode = 'no_healthy_upstream';
      }
      return {
        ok: false,
        httpStatus: res.status,
        responseTimeMs,
        bodyText,
        contentType,
        errorCode,
        userMessage,
        technicalDetail: `HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      httpStatus: res.status,
      responseTimeMs,
      bodyText,
      contentType,
      userMessage: 'OK',
    };
  } catch (e) {
    const mapped = mapFetchError(e);
    return {
      ok: false,
      httpStatus: null,
      responseTimeMs: Date.now() - t0,
      bodyText: '',
      contentType: null,
      errorCode: mapped.errorCode,
      userMessage: mapped.userMessage,
      technicalDetail: mapped.technicalDetail,
    };
  } finally {
    clearTimeout(timer);
  }
}

function isLikelyHtml(contentType: string | null, body: string): boolean {
  const ct = (contentType ?? '').toLowerCase();
  if (ct.includes('text/html')) return true;
  const trimmed = body.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function clientLooksOnline(probe: HttpProbeResult): boolean {
  if (!probe.ok || probe.httpStatus !== 200) return false;
  if (!isLikelyHtml(probe.contentType, probe.bodyText)) return true;
  const body = probe.bodyText.toLowerCase();
  return (
    body.includes('id="root"') ||
    body.includes("id='root'") ||
    body.includes('id="app"') ||
    body.includes('<div id="root"') ||
    body.length > 200
  );
}

function parseHealthJson(body: string): { ok: boolean; parseError?: string } {
  try {
    const json = JSON.parse(body) as Record<string, unknown>;
    if (json && typeof json === 'object') {
      if (json.ok === false) return { ok: false };
      if (json.ok === true || json.service != null || json.status === 'ok') return { ok: true };
      if (json.data && typeof json.data === 'object') return { ok: true };
      return { ok: true };
    }
    return { ok: false, parseError: 'Ungültiges JSON' };
  } catch {
    return { ok: false, parseError: 'JSON parse error' };
  }
}

function buildConnectivityInfo(
  partial: Partial<HealthConnectivityInfo> & { status: HealthStatus; message: string },
): HealthConnectivityInfo {
  return {
    status: partial.status,
    message: partial.message,
    url: partial.url,
    checkedAt: partial.checkedAt,
    responseTimeMs: partial.responseTimeMs,
    httpStatus: partial.httpStatus ?? null,
    errorCode: partial.errorCode,
    technicalDetail: partial.technicalDetail,
    railwayHint: partial.railwayHint,
    adminHealthAvailable: partial.adminHealthAvailable,
  };
}

/** GET Client-URL (/) — Frontend-Erreichbarkeit. */
export async function probeFrontend(urls: MainAppUrls): Promise<HealthConnectivityInfo> {
  const checkedAt = new Date().toISOString();
  const url = urls.clientUrl;

  if (!url) {
    return buildConnectivityInfo({
      status: 'unknown',
      message: 'Client-URL nicht konfiguriert',
      url: undefined,
      checkedAt,
    });
  }

  const probe = await httpProbe(`${url}/`, { headers: { Accept: 'text/html,*/*' } });
  const railwayHint = detectRailwayHint(probe.bodyText, probe.httpStatus);
  const online = clientLooksOnline(probe);

  if (online) {
    return buildConnectivityInfo({
      status: 'ok',
      message: 'Client erreichbar',
      url,
      checkedAt,
      responseTimeMs: probe.responseTimeMs,
      httpStatus: probe.httpStatus,
      railwayHint,
    });
  }

  const detail = probe.technicalDetail ?? probe.errorCode ?? 'offline';
  return buildConnectivityInfo({
    status: 'error',
    message: 'Client / Frontend: Offline oder Fehler',
    url,
    checkedAt,
    responseTimeMs: probe.responseTimeMs,
    httpStatus: probe.httpStatus,
    errorCode: probe.errorCode ?? 'client_offline',
    technicalDetail: detail,
    railwayHint,
  });
}

/** GET /api/health und optional /api/admin/health — Server/API. */
export async function probeServerApi(
  urls: MainAppUrls,
  adminToken?: string,
): Promise<HealthConnectivityInfo> {
  const checkedAt = new Date().toISOString();
  const url = urls.apiUrl;

  if (!url) {
    return buildConnectivityInfo({
      status: 'error',
      message: 'API URL nicht konfiguriert',
      checkedAt,
    });
  }

  const healthProbe = await httpProbe(`${url}/api/health`, {
    headers: { Accept: 'application/json' },
  });

  if (isLikelyHtml(healthProbe.contentType, healthProbe.bodyText) && healthProbe.ok) {
    const railwayHint = detectRailwayHint(healthProbe.bodyText, healthProbe.httpStatus);
    return buildConnectivityInfo({
      status: 'error',
      message: 'Server / API: Offline',
      url,
      checkedAt,
      responseTimeMs: healthProbe.responseTimeMs,
      httpStatus: healthProbe.httpStatus,
      errorCode: 'invalid_json',
      technicalDetail: 'JSON parse error — HTML-Antwort statt JSON',
      railwayHint,
      adminHealthAvailable: false,
    });
  }

  const parsed = parseHealthJson(healthProbe.bodyText);
  const railwayHint = detectRailwayHint(healthProbe.bodyText, healthProbe.httpStatus);

  let adminHealthAvailable = false;
  if (healthProbe.ok && parsed.ok && adminToken) {
    const adminProbe = await httpProbe(`${url}/api/admin/health`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (adminProbe.ok && !isLikelyHtml(adminProbe.contentType, adminProbe.bodyText)) {
      const adminParsed = parseHealthJson(adminProbe.bodyText);
      adminHealthAvailable = adminParsed.ok;
    }
  }

  if (healthProbe.ok && parsed.ok) {
    return buildConnectivityInfo({
      status: 'ok',
      message: adminHealthAvailable ? 'Server/API online (Admin-Health verfügbar)' : 'Server/API online',
      url,
      checkedAt,
      responseTimeMs: healthProbe.responseTimeMs,
      httpStatus: healthProbe.httpStatus,
      railwayHint,
      adminHealthAvailable,
    });
  }

  let userMessage = 'Server / API: Offline';
  let technicalDetail = healthProbe.technicalDetail ?? healthProbe.errorCode ?? 'healthcheck failed';
  if (parsed.parseError) {
    userMessage = 'Server / API: Offline';
    technicalDetail = parsed.parseError;
  } else if (!healthProbe.ok) {
    userMessage = 'Server/API konnte nicht erreicht werden.';
    technicalDetail = healthProbe.technicalDetail ?? `HTTP ${healthProbe.httpStatus ?? '—'}`;
  }

  return buildConnectivityInfo({
    status: 'error',
    message: userMessage,
    url,
    checkedAt,
    responseTimeMs: healthProbe.responseTimeMs,
    httpStatus: healthProbe.httpStatus,
    errorCode: healthProbe.errorCode ?? 'api_offline',
    technicalDetail,
    railwayHint,
    adminHealthAvailable: false,
  });
}

export async function runConnectivityChecks(
  urls: MainAppUrls,
  adminToken?: string,
): Promise<ConnectivitySnapshot> {
  const [frontend, serverApi] = await Promise.all([
    probeFrontend(urls),
    probeServerApi(urls, adminToken),
  ]);
  return {
    frontend,
    serverApi,
    checkedAt: new Date().toISOString(),
  };
}

export function isServerApiReachable(snapshot: ConnectivitySnapshot): boolean {
  return snapshot.serverApi.status === 'ok';
}

export function isFrontendReachable(snapshot: ConnectivitySnapshot): boolean {
  return snapshot.frontend.status === 'ok';
}
