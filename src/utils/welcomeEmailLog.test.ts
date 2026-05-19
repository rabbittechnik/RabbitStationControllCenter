import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isWelcomeEmailResendLogAction, showWelcomeEmailResendControl } from './welcomeEmailLog.js';
import type { SystemLog } from '../types/index.js';

describe('welcomeEmailLog utils', () => {
  it('shows resend control only for failed welcome email actions', () => {
    const log = {
      id: 1,
      tenant_id: 't1',
      user_id: 'u1',
      severity: 'error',
      category: 'audit',
      action: 'registration_welcome_email_failed',
      message: 'fail',
      created_at: new Date().toISOString(),
    } satisfies SystemLog;
    assert.equal(showWelcomeEmailResendControl(log), true);
    assert.equal(isWelcomeEmailResendLogAction('registration_welcome_email_sent'), false);
  });
});
