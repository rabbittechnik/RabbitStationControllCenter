import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mailCardValue, mailConfiguredFlag, paymentsCardValue } from './healthDisplay.js';

describe('client healthDisplay helpers', () => {
  it('treats mail.status ok as configured', () => {
    assert.equal(mailConfiguredFlag({ status: 'ok', deliveryRate: 0 }), true);
    assert.equal(mailCardValue({ status: 'ok', deliveryRate: 0 }), 'OK');
  });

  it('shows payments not configured from message', () => {
    assert.equal(
      paymentsCardValue({
        status: 'warning',
        openCases: 0,
        message: 'Payment provider not configured',
        configured: false,
      }),
      'Nicht konfiguriert',
    );
  });
});
