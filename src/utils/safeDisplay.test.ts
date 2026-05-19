import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { safeText } from './safeDisplay.js';
import { normalizeHealthResponse } from './healthNormalize.js';

describe('safeText', () => {
  it('extracts status from objects instead of rendering them', () => {
    assert.equal(safeText({ status: 'ok', connections: 23 }), 'ok');
    assert.equal(safeText({ message: 'SMTP fehlt' }), 'SMTP fehlt');
  });
});

describe('normalizeHealthResponse', () => {
  it('normalizes partial health without crashing', () => {
    const h = normalizeHealthResponse({
      database: { status: 'ok', connections: 23 } as never,
      uptime: '3 Tage' as never,
    });
    assert.equal(h.database.connections, 23);
    assert.equal(h.database.status, 'ok');
  });
});
