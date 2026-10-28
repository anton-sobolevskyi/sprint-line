import { describe, expect, it } from 'vitest';

import { passwordRuleChecks } from './auth.form-utils';

const labels = { length: '8 characters', letter: 'A letter', number: 'A number' };

describe('passwordRuleChecks', () => {
  it('marks every rule as unmet for an empty password', () => {
    expect(passwordRuleChecks('', labels).map((r) => r.ok)).toEqual([false, false, false]);
  });

  it('tracks length, letter and number independently', () => {
    expect(passwordRuleChecks('abcdefgh', labels).map((r) => r.ok)).toEqual([true, true, false]);
    expect(passwordRuleChecks('12345678', labels).map((r) => r.ok)).toEqual([true, false, true]);
    expect(passwordRuleChecks('abc1', labels).map((r) => r.ok)).toEqual([false, true, true]);
  });

  it('passes all rules for a valid password', () => {
    expect(passwordRuleChecks('sprint2026', labels).every((r) => r.ok)).toBe(true);
  });
});
