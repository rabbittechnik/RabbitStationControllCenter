import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeActionMenuPlacement } from './actionMenuPlacement.js';

describe('computeActionMenuPlacement', () => {
  it('opens below and right-aligned by default', () => {
    const p = computeActionMenuPlacement({
      anchor: { top: 100, left: 800, right: 840, bottom: 120, width: 40, height: 20, x: 800, y: 100, toJSON: () => ({}) },
      menuWidth: 240,
      menuHeight: 200,
      viewportWidth: 1200,
      viewportHeight: 800,
    });
    assert.equal(p.top, 124);
    assert.equal(p.left, 600);
  });

  it('flips upward when not enough space below', () => {
    const p = computeActionMenuPlacement({
      anchor: { top: 700, left: 400, right: 440, bottom: 720, width: 40, height: 20, x: 400, y: 700, toJSON: () => ({}) },
      menuWidth: 240,
      menuHeight: 180,
      viewportWidth: 1200,
      viewportHeight: 800,
    });
    assert.ok(p.top < 700);
  });

  it('shifts left when not enough space on the right', () => {
    const p = computeActionMenuPlacement({
      anchor: { top: 200, left: 1100, right: 1140, bottom: 220, width: 40, height: 20, x: 1100, y: 200, toJSON: () => ({}) },
      menuWidth: 240,
      menuHeight: 160,
      viewportWidth: 1200,
      viewportHeight: 800,
    });
    assert.ok(p.left <= 860);
  });
});
