import { describe, expect, it } from 'vitest';
import { evaluateCondition } from '../src/services/strategyEngine.js';

describe('evaluateCondition', () => {
  it('matches streak_below when last N multipliers are below value', () => {
    expect(evaluateCondition([2, 5, 6], { type: 'streak_below', value: 10, occurrences: 3 })).toBe(true);
  });

  it('does not match when occurrence window is incomplete', () => {
    expect(evaluateCondition([5], { type: 'streak_below', value: 10, occurrences: 2 })).toBe(false);
  });

  it('matches multiplier_above for threshold', () => {
    expect(evaluateCondition([8, 11, 12], { type: 'multiplier_above', value: 10, occurrences: 2 })).toBe(true);
  });
});
