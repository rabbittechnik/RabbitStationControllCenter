import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapSubscriptionSummary, mapTenants, normalizePlan } from './rabbitStationMappers.js';

describe('normalizePlan', () => {
  it('maps starter, pro, multi_station', () => {
    assert.equal(normalizePlan('starter'), 'starter');
    assert.equal(normalizePlan('PRO'), 'pro');
    assert.equal(normalizePlan('multi-station'), 'multi_station');
  });
});

describe('mapTenants', () => {
  it('maps subscription fields from Haupt-App API', () => {
    const rows = mapTenants([
      {
        id: 't1',
        companyName: 'Test GmbH',
        slug: 'test',
        plan: 'pro',
        subscriptionStatus: 'trial',
        trialEnd: '2026-06-01',
        trialDaysLeft: 12,
        stationCount: 2,
        userCount: 5,
        contactEmail: 'owner@test.de',
      },
    ]);
    assert.equal(rows[0].name, 'Test GmbH');
    assert.equal(rows[0].plan, 'pro');
    assert.equal(rows[0].status, 'trial');
    assert.equal(rows[0].trial_days_left, 12);
    assert.equal(rows[0].station_count, 2);
    assert.equal(rows[0].operator, 'owner@test.de');
  });

  it('marks blocked when blockedReason is set', () => {
    const rows = mapTenants([
      {
        id: 't2',
        subscriptionStatus: 'active',
        blockedReason: 'Zahlung',
      },
    ]);
    assert.equal(rows[0].status, 'blocked');
    assert.equal(rows[0].locked, 1);
  });
});

describe('mapSubscriptionSummary', () => {
  it('aggregates plan counts from tenant list', () => {
    const tenants = mapTenants([
      { id: 'a', plan: 'starter', subscriptionStatus: 'active' },
      { id: 'b', plan: 'pro', subscriptionStatus: 'trial', trialEnd: new Date().toISOString().slice(0, 10) },
      { id: 'c', plan: 'multi_station', subscriptionStatus: 'past_due' },
    ]);
    const summary = mapSubscriptionSummary(
      { byStatus: [{ subscription_status: 'active', c: 1 }, { subscription_status: 'trial', c: 1 }] },
      tenants,
    );
    assert.equal(summary.starterCustomers, 1);
    assert.equal(summary.proCustomers, 1);
    assert.equal(summary.multiStationCustomers, 1);
    assert.equal(summary.trialsExpiringToday, 1);
    assert.equal(summary.monthlyRevenue, 0);
    assert.equal(summary.monthlyRevenueTrend, 'Noch keine Zahlungsdaten verfügbar');
  });
});
