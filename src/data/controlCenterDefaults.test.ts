import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultOverviewData, normalizeOverviewData } from './controlCenterDefaults.js';

describe('normalizeOverviewData', () => {
  it('returns defaults for null', () => {
    const out = normalizeOverviewData(null);
    assert.equal(out.tenants.length, 0);
    assert.equal(out.logs.length, 0);
    assert.equal(out.health.overallStatus, 'unknown');
  });

  it('keeps valid arrays', () => {
    const out = normalizeOverviewData({
      tenants: [{ id: 't1', name: 'A', status: 'active', plan: 'pro', trial_end: null, employees: 1, last_activity_minutes: 0, locked: 0 }],
      logs: [],
    });
    assert.equal(out.tenants.length, 1);
    assert.ok(out.health.app);
  });

  it('ignores non-array tenants', () => {
    const out = normalizeOverviewData({ tenants: 'bad' as unknown as [] });
    assert.deepEqual(out.tenants, defaultOverviewData.tenants);
  });
});
