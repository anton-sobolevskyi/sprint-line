import { describe, expect, it } from 'vitest';
import { forgotPasswordSchema } from './forgot-password.schema';
describe('forgotPasswordSchema', () => {
  it('valid', () => expect(forgotPasswordSchema.safeParse({ email: 'a@b.co' }).success).toBe(true));
  it('invalid', () => expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false));
});
