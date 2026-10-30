import { describe, expect, it } from 'vitest';

import { AUTH_MESSAGES } from '@constants/messages';
import { loginFormSchema } from './login.schema';

describe('loginFormSchema', () => {
  it('accepts a valid payload', () => {
    const parsed = loginFormSchema.safeParse({
      email: 'alice@example.com',
      password: 'Password1',
    });
    expect(parsed.success).toBe(true);
  });

  it('requires email', () => {
    const parsed = loginFormSchema.safeParse({ email: '', password: 'Password1' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.message === AUTH_MESSAGES.validation.emailRequired)).toBe(
        true
      );
    }
  });

  it('rejects invalid email', () => {
    const parsed = loginFormSchema.safeParse({ email: 'not-an-email', password: 'Password1' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.message === AUTH_MESSAGES.validation.emailInvalid)).toBe(
        true
      );
    }
  });

  it('requires password length >= 8', () => {
    const parsed = loginFormSchema.safeParse({ email: 'a@b.co', password: 'short' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some((i) => i.message === AUTH_MESSAGES.validation.passwordMinLength)
      ).toBe(true);
    }
  });
});
