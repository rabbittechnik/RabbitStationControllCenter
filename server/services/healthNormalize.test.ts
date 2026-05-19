import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  databaseVersionLabel,
  mapSystemInfoFromHealth,
  normalizeAdminHealthPayload,
} from './healthNormalize.js';

describe('normalizeAdminHealthPayload', () => {
  it('maps nested database object with connections', () => {
    const health = normalizeAdminHealthPayload(
      {
        overallStatus: 'ok',
        checkedAt: '2026-05-19T10:00:00.000Z',
        app: { status: 'ok', message: 'RabbitStation Haupt-App online' },
        api: { status: 'ok' },
        database: { status: 'ok', connections: 23 },
        mail: { status: 'warning', message: 'SMTP not configured' },
        payments: { status: 'warning', message: 'Payment provider not configured' },
        backups: { status: 'warning', message: 'Backup system not configured' },
        storage: { status: 'ok' },
        uptime: '12 Tage, 4 Std.',
      },
      { configured: false },
      86,
      true,
    );

    assert.equal(health.database.status, 'ok');
    assert.equal(health.database.connections, 23);
    assert.equal(health.uptimeLabel, '12 Tage, 4 Std.');
  });
});

describe('mapSystemInfoFromHealth', () => {
  it('does not pass database object as databaseVersion string field', () => {
    const info = mapSystemInfoFromHealth({
      database: { status: 'ok', connections: 23 },
      version: '1.0.0',
      uptime: '5 Tage, 1 Std.',
    });
    assert.equal(typeof info.databaseVersion, 'string');
    assert.match(info.databaseVersion, /23/);
    assert.equal(info.uptime, '5 Tage, 1 Std.');
  });
});

describe('databaseVersionLabel', () => {
  it('formats object as text', () => {
    const label = databaseVersionLabel({ status: 'ok', connections: 23 });
    assert.match(label, /OK/);
    assert.match(label, /23/);
  });
});
