import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeOverallDisplayStatus } from './healthDisplay.js';
import type { BackupStatus, HealthResponse } from '../types.js';

function baseHealth(overrides: Partial<HealthResponse> = {}): HealthResponse {
  return {
    overallStatus: 'ok',
    checkedAt: new Date().toISOString(),
    app: { status: 'ok', message: 'online' },
    api: { status: 'ok', responseTimeMs: 12 },
    database: { status: 'ok', connections: 1 },
    mail: { status: 'ok', deliveryRate: 100, message: 'SMTP not configured' },
    payments: { status: 'ok', openCases: 0, message: 'Payment provider not configured' },
    backups: { status: 'ok', lastBackupAt: '', nextBackupAt: '' },
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
        mail: { status: 'ok', deliveryRate: 100, message: 'SMTP ready' },
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
});
