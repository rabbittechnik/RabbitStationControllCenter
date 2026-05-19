import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeOverallDisplayStatus, refineHealthComponents } from './healthDisplay.js';
import { normalizeHealthResponse } from './healthNormalize.js';
import type { BackupStatus, HealthResponse } from '../types.js';

function baseHealth(overrides: Partial<HealthResponse> = {}): HealthResponse {
  return {
    overallStatus: 'ok',
    checkedAt: new Date().toISOString(),
    app: { status: 'ok', message: 'online' },
    api: { status: 'ok', responseTimeMs: 12 },
    database: { status: 'ok', connections: 1 },
    mail: {
      status: 'ok',
      deliveryRate: 100,
      message: 'SMTP konfiguriert',
      configured: true,
    },
    payments: {
      status: 'unknown',
      openCases: 0,
      message: 'Zahlungssystem noch nicht angebunden',
      configured: false,
    },
    backups: { status: 'unknown', lastBackupAt: '', nextBackupAt: '' },
    storage: { status: 'ok', usedPercent: 0, usedGb: 0, totalGb: 0 },
    uptime: { status: 'ok', percent30Days: 0 },
    warnings: [],
    errors: [],
    ...overrides,
  };
}

const notConfiguredBackup: BackupStatus = {
  lastBackupAt: '',
  lastBackupStatus: 'not_configured',
  nextBackupAt: '',
  sizeBytes: 0,
  configured: false,
  message: 'Backup system not configured',
};

describe('computeOverallDisplayStatus', () => {
  it('does not report outage when only optional systems are missing', () => {
    const result = computeOverallDisplayStatus(baseHealth(), notConfiguredBackup, []);
    assert.notEqual(result.label, 'outage');
    assert.equal(result.label, 'partial');
  });

  it('reports warning when mail failed in logs', () => {
    const result = computeOverallDisplayStatus(
      baseHealth({
        mail: { status: 'ok', deliveryRate: 100, message: 'SMTP konfiguriert', configured: true },
      }),
      { ...notConfiguredBackup, configured: true, lastBackupStatus: 'success' },
      [
        {
          id: 1,
          tenant_id: null,
          severity: 'error',
          category: 'audit',
          action: 'registration_welcome_email_failed',
          message: 'x',
          created_at: new Date().toISOString(),
        },
      ],
    );
    assert.equal(result.label, 'warning');
  });

  it('reports outage when core services fail', () => {
    const result = computeOverallDisplayStatus(
      baseHealth({ database: { status: 'error', connections: 0 } }),
      notConfiguredBackup,
      [],
    );
    assert.equal(result.label, 'outage');
  });

  it('does not crash when mail/payments objects are missing', () => {
    const broken = {
      ...baseHealth(),
      mail: undefined,
      payments: undefined,
    } as unknown as HealthResponse;
    const result = computeOverallDisplayStatus(broken, notConfiguredBackup, []);
    assert.ok(result.label);
  });
});

describe('refineHealthComponents', () => {
  it('handles missing backups and uptime without throwing', () => {
    const health = normalizeHealthResponse(
      { app: { status: 'ok', message: 'online' }, api: { status: 'ok' }, database: { status: 'ok' }, mail: { status: 'ok' } },
      {},
      1,
      true,
    );
    const refined = refineHealthComponents(health, undefined, []);
    assert.equal(refined.app.message, 'online');
    assert.ok(refined.uptime);
  });
});
