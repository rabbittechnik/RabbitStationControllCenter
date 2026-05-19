import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUserFacingError } from './displayErrors.js';

describe('sanitizeUserFacingError', () => {
  it('replaces undefined property read errors', () => {
    const msg = sanitizeUserFacingError("Cannot read properties of undefined (reading 'message')");
    assert.equal(msg, 'Statusdaten konnten nicht vollständig geladen werden.');
  });

  it('passes through normal messages', () => {
    assert.equal(sanitizeUserFacingError('Haupt-App nicht erreichbar'), 'Haupt-App nicht erreichbar');
  });
});
