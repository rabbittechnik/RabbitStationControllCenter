import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Tenant } from '../types';
import {
  countPendingPayments,
  countSumUpPending,
  isPaymentPending,
  paymentStatusLabel,
  requestedPlanLabel,
} from './paymentDisplay';

function tenant(partial: Partial<Tenant> & { id: string }): Tenant {
  return {
    id: partial.id,
    name: partial.name ?? 'Test',
    status: partial.status ?? 'trial',
    plan: partial.plan ?? 'starter',
    trial_end: null,
    trial_days_left: null,
    employees: 0,
    station_count: 1,
    last_activity_minutes: null,
    locked: 0,
    ...partial,
  };
}

describe('paymentDisplay', () => {
  it('labels payment status in German', () => {
    assert.equal(paymentStatusLabel('pending'), 'Zahlung ausstehend');
    assert.equal(paymentStatusLabel('confirmed'), 'Zahlung bestätigt');
    assert.equal(paymentStatusLabel('failed'), 'Zahlung fehlgeschlagen');
  });

  it('detects pending payment from payment_status or subscription', () => {
    assert.equal(isPaymentPending(tenant({ id: '1', payment_status: 'pending' })), true);
    assert.equal(
      isPaymentPending(tenant({ id: '2', subscription_status: 'pending_payment', status: 'pending_payment' })),
      true,
    );
    assert.equal(isPaymentPending(tenant({ id: '3', payment_status: 'confirmed', status: 'active' })), false);
  });

  it('formats requested plan label', () => {
    const t = tenant({ id: '4', requested_plan: 'pro' });
    assert.equal(requestedPlanLabel(t), 'Pro');
  });

  it('counts pending and SumUp payments', () => {
    const list = [
      tenant({ id: 'a', payment_status: 'pending', payment_provider: 'sumup' }),
      tenant({ id: 'b', payment_status: 'pending', payment_provider: 'stripe' }),
      tenant({ id: 'c', payment_status: 'confirmed' }),
    ];
    assert.equal(countPendingPayments(list), 2);
    assert.equal(countSumUpPending(list), 1);
  });
});
