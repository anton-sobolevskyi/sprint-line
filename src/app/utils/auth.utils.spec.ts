import { describe, expect, it } from 'vitest';

import { passwordRuleChecks } from './auth.utils';

describe('passwordRuleChecks', () => {
  it('returns all checks', () => {
    const labels = { length: 'length', letter: 'letter', number: 'number' };
    expect(passwordRuleChecks('abc12345', labels)).toEqual([
      { label: 'length', ok: true },
      { label: 'letter', ok: true },
      { label: 'number', ok: true },
    ]);
  });
  it('fails short/no letter/no number', () => {
    const labels = { length: 'length', letter: 'letter', number: 'number' };
    expect(passwordRuleChecks('123', labels)[0]!.ok).toBe(false);
    expect(passwordRuleChecks('abcdefgh', labels)[2]!.ok).toBe(false);
    expect(passwordRuleChecks('12345678', labels)[1]!.ok).toBe(false);
  });
});