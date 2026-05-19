import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapResendWelcomeEmailUserMessage,
  resendWelcomeEmailHttpStatus,
} from './resendWelcomeEmailProxy.js';

describe('resendWelcomeEmailProxy', () => {
  it('maps known error codes to German user messages', () => {
    assert.match(
      mapResendWelcomeEmailUserMessage('rate_limit'),
      /mehrere Willkommens-E-Mails/,
    );
    assert.equal(mapResendWelcomeEmailUserMessage('smtp_not_available'), 'Mailversand ist aktuell nicht bereit.');
    assert.equal(
      mapResendWelcomeEmailUserMessage('user_not_found'),
      'Benutzer konnte nicht gefunden werden.',
    );
    assert.equal(mapResendWelcomeEmailUserMessage('timeout'), 'Haupt-App nicht erreichbar.');
  });

  it('maps HTTP status for rate limit', () => {
    assert.equal(resendWelcomeEmailHttpStatus('rate_limit'), 429);
    assert.equal(resendWelcomeEmailHttpStatus('network_error'), 502);
  });
});
