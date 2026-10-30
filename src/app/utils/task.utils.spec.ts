import { describe, expect, it } from 'vitest';

import { isEditableTarget } from './task.utils';

describe('isEditableTarget', () => {
  it('returns false for null', () => {
    expect(isEditableTarget(null)).toBe(false);
  });
  it('returns true for input/textarea/select', () => {
    for (const tag of ['INPUT', 'TEXTAREA', 'SELECT']) {
      const el = document.createElement(tag.toLowerCase());
      expect(isEditableTarget(el)).toBe(true);
    }
  });
  it('returns false for other', () => {
    const div = document.createElement('div');
    expect(isEditableTarget(div)).toBeFalsy();
  });
});