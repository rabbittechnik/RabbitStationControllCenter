import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyMailForDisplay,
  classifyPaymentsForDisplay,
  databaseVersionLabel,
  mapSystemInfoFromHealth,
  normalizeHealthResponse,
  normalizeMainAppHealth,
  unwrapHealthPayload,
} from './healthNormalize.js';
import { computeOverallDisplayStatus, refineHealthComponents } from './healthDisplay.js';
import type { BackupStatus } from '../types.js';

const sampleEnvelope = {
  ok: true,
  data: {
    overallStatus: 'warning',
    checkedAt: '2026-05-19T18:33:32.421Z',
    app: { status: 'ok', message: 'RabbitStation Haupt-App online' },
    api: { status: 'ok' },
    database: { status: 'ok', connections: 1 },
    mail: { status: 'ok' },
    payments: { status: 'warning', message: 'Payment provider not configured' },
    backups: { status: 'warning', message: 'Backup system not configured' },
    storage: { status: 'ok' },
    uptime: '71 Tage, 18 Std.',
    environment: 'production',
    version: '1.0.0',
  },
};

describe('unwrapHealthPayload', () => {
  it('reads health from { ok: true, data: {...} }', () => {
    const inner = unwrapHealthPayload(sampleEnvelope);
    assert.equal(inner.overallStatus, 'warning');
    assert.equal((inner.mail as { status: string }).status, 'ok');
    assert.equal(inner.uptime, '71 Tage, 18 Std.');
  });
});

describe('normalizeHealthResponse', () => {
  it('maps wrapped API payload with correct mail and optional systems', () => {
    const health = normalizeHealthResponse(
      sampleEnvelope,
      { configured: false, message: 'Backup system not configured' },
      42,
      true,
    );

    assert.equal(health.mail.status, 'ok');
    assert.equal(health.mail.configured, true);
    assert.equal(health.mail.message, 'Mailversand konfiguriert');
    assert.equal(health.payments.configured, false);
    assert.equal(health.payments.message, 'Zahlungssystem noch nicht angebunden');
    assert.equal(health.uptimeLabel, '71 Tage, 18 Std.');
    assert.equal(health.database.connections, 1);
  });

  it('does not treat mail.status ok as not configured without message', () => {
    const mail = classifyMailForDisplay({ status: 'ok' });
    assert.equal(mail.configured, true);
    assert.equal(mail.displayValue, 'OK');
    assert.equal(mail.displaySubtitle, 'Mailversand konfiguriert');
  });

  it('shows payments as not configured for provider message', () => {
    const pay = classifyPaymentsForDisplay({
      status: 'warning',
      message: 'Payment provider not configured',
    });
    assert.equal(pay.configured, false);
    assert.equal(pay.displayValue, 'Nicht konfiguriert');
  });
});

describe('computeOverallDisplayStatus', () => {
  it('shows partial not outage when only optional systems are not configured', () => {
    const health = normalizeHealthResponse(
      sampleEnvelope,
      { configured: false, message: 'Backup system not configured' },
      10,
      true,
    );
    const backups: BackupStatus = {
      lastBackupAt: '',
      lastBackupStatus: 'not_configured',
      nextBackupAt: '',
      sizeBytes: 0,
      configured: false,
      message: 'Backup system not configured',
    };
    const result = computeOverallDisplayStatus(health, backups, []);
    assert.notEqual(result.label, 'outage');
    assert.equal(result.label, 'partial');
  });
});

describe('mapSystemInfoFromHealth', () => {
  it('reads environment and version from wrapped payload', () => {
    const info = mapSystemInfoFromHealth(sampleEnvelope);
    assert.equal(info.environment, 'production');
    assert.equal(info.version, '1.0.0');
    assert.equal(info.uptime, '71 Tage, 18 Std.');
  });

  it('does not pass database object as databaseVersion string field', () => {
    const info = mapSystemInfoFromHealth({
      database: { status: 'ok', connections: 23 },
      version: '1.0.0',
      uptime: '5 Tage, 1 Std.',
    });
    assert.equal(typeof info.databaseVersion, 'string');
    assert.match(info.databaseVersion, /23/);
  });
});

describe('databaseVersionLabel', () => {
  it('formats object as text', () => {
    const label = databaseVersionLabel({ status: 'ok', connections: 23 });
    assert.match(label, /OK/);
    assert.match(label, /23/);
  });
});

describe('robust health variants', () => {
  const backupMeta = { configured: true, lastBackupStatus: 'success' as const };

  it('A) mail only with status ok', () => {
    const health = normalizeHealthResponse(
      { ok: true, data: { mail: { status: 'ok' }, app: { status: 'ok' }, api: { status: 'ok' }, database: { status: 'ok' } } },
      backupMeta,
      1,
      true,
    );
    assert.equal(health.mail.status, 'ok');
    assert.equal(health.mail.configured, true);
    assert.equal(health.mail.message, 'Mailversand konfiguriert');
  });

  it('B) payments without configured field', () => {
    const health = normalizeHealthResponse(
      {
        payments: { status: 'warning', message: 'Payment provider not configured' },
        app: { status: 'ok' },
        api: { status: 'ok' },
        database: { status: 'ok' },
        mail: { status: 'ok' },
      },
      backupMeta,
      1,
      true,
    );
    assert.equal(health.payments.configured, false);
    assert.match(health.payments.message ?? '', /noch nicht angebunden/i);
  });

  it('C) backups only with status ok', () => {
    const health = normalizeHealthResponse(
      { backups: { status: 'ok' }, app: { status: 'ok' }, api: { status: 'ok' }, database: { status: 'ok' }, mail: { status: 'ok' } },
      { configured: true, lastBackupStatus: 'success' },
      1,
      true,
    );
    assert.equal(health.backups.status, 'ok');
  });

  it('D) accepts envelope with data wrapper', () => {
    const health = normalizeHealthResponse(
      { ok: true, data: { overallStatus: 'warning', mail: { status: 'ok' } } },
      backupMeta,
      1,
      true,
    );
    assert.equal(health.overallStatus, 'warning');
    assert.equal(health.mail.configured, true);
  });

  it('E) missing mail, payments, backups sections', () => {
    const health = normalizeHealthResponse(
      { app: { status: 'ok' }, api: { status: 'ok' }, database: { status: 'ok' } },
      {},
      1,
      true,
    );
    assert.ok(health.mail);
    assert.ok(health.payments);
    assert.ok(health.backups);
    assert.equal(typeof health.mail.configured, 'boolean');
  });
});

describe('normalizeMainAppHealth', () => {
  it('unwraps { ok, data } and fills missing messages', () => {
    const raw = normalizeMainAppHealth({
      ok: true,
      data: {
        overallStatus: 'warning',
        app: { status: 'ok' },
        mail: { status: 'ok' },
        payments: { status: 'warning' },
      },
    });
    assert.equal((raw.app as { message: string }).message, 'Keine App-Meldung verfügbar');
    assert.equal((raw.mail as { message: string }).message, 'Mailversand konfiguriert');
    assert.equal((raw.payments as { message: string }).message, 'Keine Zahlungs-Meldung verfügbar');
  });

  it('uses custom mail message when provided', () => {
    const raw = normalizeMainAppHealth({
      mail: { status: 'ok', message: 'SMTP konfiguriert und Versand erfolgreich getestet' },
    });
    assert.match((raw.mail as { message: string }).message, /getestet/);
  });
});

describe('refineHealthComponents', () => {
  it('does not crash when uptime or backups are incomplete', () => {
    const health = normalizeHealthResponse(
      { app: { status: 'ok' }, api: { status: 'ok' }, database: { status: 'ok' }, storage: { usedPercent: 1, status: 'ok' } },
      {},
      5,
      true,
    );
    const broken = { ...health, uptime: undefined } as unknown as typeof health;
    assert.doesNotThrow(() => refineHealthComponents(broken, undefined, []));
  });
});
