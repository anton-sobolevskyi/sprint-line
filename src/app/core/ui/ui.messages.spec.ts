import { describe, expect, it } from 'vitest';

import { UI_MESSAGES } from './ui.messages';

describe('UI_MESSAGES', () => {
  it('is defined', () => {
    expect(UI_MESSAGES.dialog.cancel).toBe('Cancel');
  });
});