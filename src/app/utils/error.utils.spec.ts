import { describe, expect, it } from 'vitest';

import { firstFieldErrorMessage } from './error.utils';

describe('firstFieldErrorMessage', () => {
  it('returns null for empty or missing lists', () => {
    expect(firstFieldErrorMessage(undefined)).toBeNull();
    expect(firstFieldErrorMessage([])).toBeNull();
  });

  it('returns the message from the first entry', () => {
    expect(firstFieldErrorMessage([{ message: 'Required' }])).toBe('Required');
  });

  it('returns null when the first entry is missing or empty', () => {
    expect(firstFieldErrorMessage([null, { message: 'Too short' }])).toBeNull();
    expect(firstFieldErrorMessage([{ message: '' }])).toBeNull();
  });
});
