import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addDaysToIso, planLabel, statusLabel, trialDaysLabel } from './tenantPlan.js';

describe('tenantPlan labels', () => {
  it('returns German labels', () => {
    assert.equal(planLabel('starter'), 'Starter');
    assert.equal(planLabel('pro'), 'Pro');
    assert.equal(planLabel('multi_station'), 'Multi-Station');
    assert.equal(statusLabel('trial'), 'Testphase');
    assert.equal(statusLabel('past_due'), 'Zahlung offen');
  });

  it('adds days to iso date', () => {
    assert.equal(addDaysToIso('2026-01-01', 7), '2026-01-08');
  });

  it('formats trial days', () => {
    assert.equal(trialDaysLabel(3), '3 Tage');
    assert.equal(trialDaysLabel(0), '0 Tage');
  });
});
