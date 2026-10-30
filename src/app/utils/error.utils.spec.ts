import { describe, expect, it } from 'vitest';

import { firstFieldErrorMessage } from './error.utils';

describe('firstFieldErrorMessage', () => {
  it('returns null for empty or missing lists', () => {
    expect(firstFieldErrorMessage(undefined)).toBeNull();
    expect(firstFieldErrorMessage([])).toBeNull();
  });

  it('returns the first non-empty message', () => {
    expect(firstFieldErrorMessage([{ message: 'Required' }])).toBe('Required');
    expect(firstFieldErrorMessage([null, { message: 'Too short' }])).toBe('Too short');
  });

  it('skips empty messages', () => {
    expect(firstFieldErrorMessage([{ message: '' }])).toBeNull();
  });
});
