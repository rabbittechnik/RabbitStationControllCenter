import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLogAction,
  enrichLogs,
  applyTenantActivityFromLogs,
  hasRecentMailFailure,
} from './logFormat.js';
import type { Tenant } from '../types.js';

describe('formatLogAction', () => {
  it('maps known actions to German labels', () => {
    assert.equal(formatLogAction('login_success'), 'Login erfolgreich');
    assert.equal(
      formatLogAction('registration_welcome_email_failed'),
      'Willkommens-E-Mail konnte nicht gesendet werden',
    );
  });

  it('formats unknown actions readably', () => {
    assert.equal(formatLogAction('custom_event'), 'Custom Event');
  });
});

describe('enrichLogs', () => {
  const tenants: Tenant[] = [
    {
      id: 't1',
      name: 'Rabbit-Technik',
      slug: 'hasen-tankstelle',
      operator: 'rabbit.technik@gmail.com',
      status: 'active',
      plan: 'pro',
      trial_end: null,
      trial_days_left: null,
      employees: 2,
      station_count: 1,
      last_activity_minutes: null,
      locked: 0,
    },
  ];

  it('enriches tenant headline from tenant list', () => {
    const logs = enrichLogs(
      [
        {
          id: 1,
          tenant_id: 't1',
          user_id: 'u1',
          action: 'login_success',
          metadata_json: JSON.stringify({ userEmail: 'admin@test.local', role: 'owner' }),
          created_at: new Date().toISOString(),
        },
      ],
      tenants,
    );
    assert.match(logs[0].headline ?? '', /Rabbit-Technik/);
    assert.equal(logs[0].action_label, 'Login erfolgreich');
    assert.equal(logs[0].subline, 'rabbit.technik@gmail.com');
  });
});

describe('applyTenantActivityFromLogs', () => {
  it('never sets invalid minute counts', () => {
    const tenants: Tenant[] = [
      {
        id: 't1',
        name: 'Demo',
        status: 'trial',
        plan: 'starter',
        trial_end: null,
        trial_days_left: 5,
        employees: 0,
        station_count: 1,
        last_activity_minutes: 99999,
        locked: 0,
      },
    ];
    const iso = new Date(Date.now() - 120_000).toISOString();
    const updated = applyTenantActivityFromLogs(tenants, [
      {
        id: 1,
        tenant_id: 't1',
        severity: 'info',
        category: 'audit',
        action: 'login_success',
        message: 'Login',
        created_at: iso,
      },
    ]);
    assert.ok((updated[0].last_activity_minutes ?? 0) < 10_000);
    assert.equal(updated[0].last_activity_at, iso);
  });
});

describe('hasRecentMailFailure', () => {
  it('detects recent mail failures in logs', () => {
    const logs = [
      {
        id: 1,
        tenant_id: null,
        severity: 'error',
        category: 'audit',
        action: 'registration_welcome_email_failed',
        message: 'fail',
        created_at: new Date().toISOString(),
      },
    ];
    assert.equal(hasRecentMailFailure(logs), true);
  });
});
