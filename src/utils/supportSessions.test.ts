import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSupportRemaining,
  isStartedToday,
  supportAccessModeLabel,
  supportApiErrorMessage,
  supportSessionStats,
  supportStatusLabel,
} from './supportSessions.js';
import type { SupportSession } from '../types/index.js';

const baseSession: SupportSession = {
  id: 's1',
  tenantId: 't1',
  tenantName: 'Demo',
  stationName: 'Station A',
  adminEmail: 'admin@test.local',
  reason: 'Test',
  accessMode: 'read_only',
  status: 'active',
  startedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
  endedAt: null,
};

describe('supportSessions utils', () => {
  it('labels status and access mode in German', () => {
    assert.equal(supportStatusLabel('active'), 'Aktiv');
    assert.equal(supportStatusLabel('expired'), 'Abgelaufen');
    assert.equal(supportAccessModeLabel('read_only'), 'Nur lesen');
    assert.equal(supportAccessModeLabel('support_write'), 'Support mit Bearbeitung');
  });

  it('computes session stats', () => {
    const today = new Date().toISOString();
    const sessions: SupportSession[] = [
      { ...baseSession, id: '1', status: 'active', startedAt: today },
      { ...baseSession, id: '2', status: 'ended', startedAt: today },
      { ...baseSession, id: '3', status: 'expired', startedAt: '2000-01-01T00:00:00.000Z' },
    ];
    const stats = supportSessionStats(sessions);
    assert.equal(stats.active, 1);
    assert.equal(stats.ended, 1);
    assert.equal(stats.expired, 1);
    assert.equal(stats.startedToday, 2);
  });

  it('formats remaining time for active sessions', () => {
    const remaining = formatSupportRemaining(baseSession.expiresAt, 'active');
    assert.match(remaining, /Min\.|Std\./);
    assert.equal(formatSupportRemaining(baseSession.expiresAt, 'ended'), '–');
  });

  it('maps API errors to user messages', () => {
    assert.equal(
      supportApiErrorMessage({ code: 'forbidden', message: 'x' }),
      'Keine Berechtigung für Support-Zugriffe.',
    );
    assert.equal(
      supportApiErrorMessage({ code: 'network_error', message: 'Haupt-App nicht erreichbar.' }),
      'Haupt-App nicht erreichbar.',
    );
  });

  it('detects sessions started today', () => {
    assert.equal(isStartedToday(new Date().toISOString()), true);
    assert.equal(isStartedToday('2000-01-01T00:00:00.000Z'), false);
  });
});
