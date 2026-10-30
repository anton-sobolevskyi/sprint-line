import { describe, expect, it } from 'vitest';

import * as messages from './messages';

describe('messages constants', () => {
  it('are defined', () => {
    expect(messages.SHELL_MESSAGES).toBeTruthy();
    expect(messages.AUTH_MESSAGES).toBeTruthy();
  });
});