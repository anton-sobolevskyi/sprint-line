import { describe, expect, it } from 'vitest';

import { AUTH_MESSAGES } from '@constants/messages';
import { registerFormSchema } from './register.schema';

describe('registerFormSchema', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'Password1',
  };

  it('accepts a valid payload', () => {
    expect(registerFormSchema.safeParse(valid).success).toBe(true);
  });

  it('requires a name of at least 2 characters', () => {
    const short = registerFormSchema.safeParse({ ...valid, name: 'A' });
    expect(short.success).toBe(false);
    if (!short.success) {
      expect(
        short.error.issues.some((i) => i.message === AUTH_MESSAGES.validation.nameMinLength)
      ).toBe(true);
    }
  });

  it('rejects invalid email', () => {
    const bad = registerFormSchema.safeParse({ ...valid, email: 'not-email' });
    expect(bad.success).toBe(false);
  });

  it('requires password letter and number pattern', () => {
    const weak = registerFormSchema.safeParse({ ...valid, password: 'password' });
    expect(weak.success).toBe(false);
    if (!weak.success) {
      expect(
        weak.error.issues.some((i) => i.message === AUTH_MESSAGES.validation.passwordPattern)
      ).toBe(true);
    }
  });
});
