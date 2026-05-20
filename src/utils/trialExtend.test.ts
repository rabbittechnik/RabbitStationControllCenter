import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Tenant } from '../types';
import { canExtendTrial, extendTrialDisabledReason, trialExtendErrorMessage } from './trialExtend';
import { isTrialExtendedLogAction } from './trialExtendLog';

function tenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 't1',
    name: 'Test GmbH',
    status: 'trial',
    plan: 'starter',
    trial_end: new Date(Date.now() + 86400000).toISOString(),
    trial_days_left: 5,
    employees: 1,
    station_count: 1,
    last_activity_minutes: null,
    locked: 0,
    ...overrides,
  };
}

describe('trialExtend utils', () => {
  it('allows extend for trial and expired', () => {
    assert.equal(canExtendTrial(tenant({ status: 'trial' })), true);
    assert.equal(canExtendTrial(tenant({ status: 'expired', trial_days_left: 0 })), true);
  });

  it('blocks extend for active subscription', () => {
    assert.equal(canExtendTrial(tenant({ status: 'active' })), false);
    assert.match(extendTrialDisabledReason(tenant({ status: 'active' })) ?? '', /aktives Abo/);
  });

  it('maps API error codes to German messages', () => {
    assert.match(trialExtendErrorMessage('tenant_already_active', ''), /aktives Abo/);
    assert.match(trialExtendErrorMessage('reason_required', ''), /Grund/);
    assert.match(trialExtendErrorMessage('network_error', ''), /nicht erreichbar/);
  });

  it('detects trial_extended log action', () => {
    assert.equal(isTrialExtendedLogAction('trial_extended'), true);
    assert.equal(isTrialExtendedLogAction('registration.completed'), false);
  });
});
