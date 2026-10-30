import { describe, expect, it } from 'vitest';

import { toDateInputValue, toIsoDueDate } from './format.utils';

describe('format.utils', () => {
  it('returns empty for null/undefined/invalid', () => {
    expect(toDateInputValue(null)).toBe('');
    expect(toDateInputValue(undefined)).toBe('');
    expect(toDateInputValue('not-a-date')).toBe('');
  });
  it('formats valid iso', () => {
    expect(toDateInputValue('2024-05-06T10:00:00Z')).toBe('2024-05-06');
  });
  it('toIsoDueDate appends time', () => {
    expect(toIsoDueDate('2024-05-06')).toBe('2024-05-06T17:00:00Z');
  });
});