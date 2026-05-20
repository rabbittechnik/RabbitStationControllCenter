import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatLogAction,
  formatLogMessage,
  enrichLogs,
  applyTenantActivityFromLogs,
  hasRecentMailFailure,
  isWelcomeEmailResendLogAction,
  welcomeEmailResendState,
} from './logFormat.js';
import type { Tenant } from '../types.js';

describe('formatLogAction', () => {
  it('maps known actions to German labels', () => {
    assert.equal(formatLogAction('trial_extended'), 'Testzeitraum verlängert');
    assert.equal(formatLogAction('login_success'), 'Login erfolgreich');
    assert.equal(
      formatLogAction('registration_welcome_email_failed'),
      'Willkommens-E-Mail konnte nicht gesendet werden',
    );
  });

  it('formats unknown actions readably', () => {
    assert.equal(formatLogAction('custom_event'), 'Custom Event');
  });

  it('maps payment-related actions', () => {
    assert.equal(formatLogAction('payment_started'), 'Kunde hat Zahlung gestartet');
    assert.equal(formatLogAction('subscription_manually_activated'), 'Abo manuell freigeschaltet');
    assert.equal(formatLogAction('payment_failed'), 'Zahlung fehlgeschlagen');
  });
});

describe('formatLogMessage', () => {
  it('appends plan and provider for payment_started', () => {
    const msg = formatLogMessage('payment_started', {
      requestedPlan: 'pro',
      paymentProvider: 'sumup',
      userEmail: 'kunde@test.de',
    });
    assert.match(msg, /Kunde hat Zahlung gestartet/);
    assert.match(msg, /Pro/);
    assert.match(msg, /SumUp/);
    assert.match(msg, /kunde@test.de/);
  });

  it('appends reference for manual activation', () => {
    const msg = formatLogMessage('subscription_manually_activated', {
      plan: 'pro',
      paymentProvider: 'sumup',
      paymentReference: 'SumUp geprüft 20.05.2026',
      source: 'control_center',
    });
    assert.match(msg, /manuell freigeschaltet/i);
    assert.match(msg, /SumUp geprüft/);
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

describe('welcome email resend logs', () => {
  const tenants: Tenant[] = [
    {
      id: 't1',
      name: 'Rabbit-Technik',
      slug: 'hasen-tankstelle',
      operator: 'owner@test.local',
      status: 'active',
      plan: 'pro',
      trial_end: null,
      trial_days_left: null,
      employees: 1,
      station_count: 1,
      last_activity_minutes: null,
      locked: 0,
    },
  ];

  it('parses recipientEmail and safeMessage from metadata', () => {
    const logs = enrichLogs(
      [
        {
          id: 9,
          tenant_id: 't1',
          user_id: 'u1',
          action: 'registration_welcome_email_failed',
          metadata_json: JSON.stringify({
            recipientEmail: 'user@test.local',
            safeMessage: 'SMTP-Verbindung fehlgeschlagen',
            tenantName: 'Rabbit-Technik GmbH',
          }),
          created_at: new Date().toISOString(),
        },
      ],
      tenants,
    );
    assert.equal(logs[0].user_email, 'user@test.local');
    assert.equal(logs[0].error_message, 'SMTP-Verbindung fehlgeschlagen');
    assert.equal(logs[0].can_resend_welcome, true);
  });

  it('disables resend without user id', () => {
    const state = welcomeEmailResendState('t1', null, 'user@test.local', 'registration_welcome_email_failed');
    assert.equal(state.canResend, false);
    assert.match(state.disabledReason ?? '', /eindeutig/);
  });

  it('detects resendable actions', () => {
    assert.equal(isWelcomeEmailResendLogAction('registration_welcome_email_resend_failed'), true);
    assert.equal(isWelcomeEmailResendLogAction('login_success'), false);
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
