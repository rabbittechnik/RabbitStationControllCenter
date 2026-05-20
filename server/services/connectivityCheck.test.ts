import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeConnectivityBanner,
  buildHealthFromConnectivity,
} from './connectivityHealth.js';
import type { ConnectivitySnapshot } from './connectivityCheck.js';
import type { HealthConnectivityInfo } from '../types.js';

function probe(partial: Partial<HealthConnectivityInfo>): HealthConnectivityInfo {
  return {
    status: partial.status ?? 'unknown',
    message: partial.message ?? '',
    url: partial.url,
    checkedAt: partial.checkedAt ?? new Date().toISOString(),
    responseTimeMs: partial.responseTimeMs,
    httpStatus: partial.httpStatus ?? null,
    errorCode: partial.errorCode,
    technicalDetail: partial.technicalDetail,
    railwayHint: partial.railwayHint,
    adminHealthAvailable: partial.adminHealthAvailable,
  };
}

function snapshot(
  fe: Partial<HealthConnectivityInfo>,
  api: Partial<HealthConnectivityInfo>,
): ConnectivitySnapshot {
  return {
    checkedAt: new Date().toISOString(),
    frontend: probe(fe),
    serverApi: probe(api),
  };
}

describe('computeConnectivityBanner', () => {
  it('warns when frontend online but API offline', () => {
    const banner = computeConnectivityBanner(
      snapshot(
        { status: 'ok', message: 'Client erreichbar' },
        { status: 'error', message: 'Server offline' },
      ),
    );
    assert.match(banner, /Frontend ist online/);
    assert.match(banner, /Server\/API ist offline/);
  });

  it('reports API online frontend offline', () => {
    const banner = computeConnectivityBanner(
      snapshot(
        { status: 'error', message: 'Client offline' },
        { status: 'ok', message: 'Server ok' },
      ),
    );
    assert.match(banner, /Frontend ist nicht erreichbar/);
  });
});

describe('buildHealthFromConnectivity', () => {
  it('marks database and mail as not checkable when API offline', () => {
    const health = buildHealthFromConnectivity(
      snapshot(
        { status: 'ok', message: 'Client ok' },
        { status: 'error', message: 'Server down', technicalDetail: 'HTTP 502' },
      ),
    );
    assert.equal(health.overallStatus, 'error');
    assert.equal(health.overallLabel, 'outage');
    assert.equal(health.database.status, 'unknown');
    assert.equal(health.mail.message, 'Nicht prüfbar – Server/API offline');
    assert.equal(health.serverApi.status, 'error');
    assert.equal(health.frontend.status, 'ok');
  });
});

describe('probeServerApi JSON parse', () => {
  it('treats HTML response as invalid JSON', async () => {
    const original = globalThis.fetch;
    mock.method(globalThis, 'fetch', async () =>
      new Response('<!DOCTYPE html><html>Railway</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );
    try {
      const { probeServerApi } = await import('./connectivityCheck.js');
      const result = await probeServerApi(
        { clientUrl: null, apiUrl: 'https://example.test', serverUrl: 'https://example.test' },
        undefined,
      );
      assert.equal(result.status, 'error');
      assert.match(result.technicalDetail ?? '', /JSON parse error/i);
    } finally {
      globalThis.fetch = original;
    }
  });
});
