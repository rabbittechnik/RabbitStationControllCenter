import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mailCardValue,
  mailConfiguredFlag,
  notCheckableCardValue,
  paymentsCardValue,
  serverApiOffline,
} from './healthDisplay.js';
import type { HealthResponse } from '../types';

describe('client healthDisplay helpers', () => {
  it('treats mail.status ok as configured', () => {
    assert.equal(mailConfiguredFlag({ status: 'ok', deliveryRate: 0 }), true);
    assert.equal(mailCardValue({ status: 'ok', deliveryRate: 0 }), 'OK');
  });

  it('detects server API offline for dependent cards', () => {
    const health = {
      serverApi: { status: 'error', message: 'down' },
      api: { status: 'error', responseTimeMs: 0 },
    } as HealthResponse;
    assert.equal(serverApiOffline(health), true);
    assert.equal(notCheckableCardValue(), 'Nicht prüfbar');
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
