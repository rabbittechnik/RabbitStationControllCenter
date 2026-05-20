import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extendTrialHttpStatus, mapExtendTrialUserMessage } from './extendTrialProxy.js';

describe('extendTrialProxy', () => {
  it('maps known error codes to German user messages', () => {
    assert.equal(
      mapExtendTrialUserMessage('tenant_already_active'),
      'Der Kunde hat bereits ein aktives Abo.',
    );
    assert.equal(
      mapExtendTrialUserMessage('reason_required'),
      'Bitte geben Sie einen Grund für die Verlängerung an.',
    );
    assert.equal(
      mapExtendTrialUserMessage('invalid_days'),
      'Bitte wählen Sie eine gültige Anzahl an Tagen.',
    );
    assert.equal(mapExtendTrialUserMessage('tenant_not_found'), 'Kunde wurde nicht gefunden.');
    assert.equal(
      mapExtendTrialUserMessage('network_error'),
      'Haupt-App ist aktuell nicht erreichbar.',
    );
  });

  it('maps HTTP status codes', () => {
    assert.equal(extendTrialHttpStatus('tenant_already_active'), 409);
    assert.equal(extendTrialHttpStatus('reason_required'), 400);
    assert.equal(extendTrialHttpStatus('network_error'), 502);
    assert.equal(extendTrialHttpStatus('tenant_not_found'), 404);
  });
});
