import { describe, expect, it } from 'vitest';

import { AUTH_MESSAGES } from './auth.messages';
import { loginFormSchema, registerFormSchema } from './auth.schemas';

describe('auth schemas', () => {
  it('accepts a valid login payload', () => {
    const result = loginFormSchema.safeParse({
      email: 'alice@example.com',
      password: 'Secret12',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty login email with message constant', () => {
    const result = loginFormSchema.safeParse({ email: '', password: 'Secret12' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(AUTH_MESSAGES.validation.emailRequired);
    }
  });

  it('rejects register password without a number', () => {
    const result = registerFormSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'SecretOnly',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain(AUTH_MESSAGES.validation.passwordPattern);
    }
  });
});
