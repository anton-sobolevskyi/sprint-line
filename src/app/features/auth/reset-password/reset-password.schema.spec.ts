import { describe, expect, it } from 'vitest';
import { resetPasswordSchema } from './reset-password.schema';
describe('resetPasswordSchema', () => {
  it('valid', () => expect(resetPasswordSchema.safeParse({ newPassword: 'Password1', confirmPassword: 'Password1' }).success).toBe(true));
  it('mismatch', () => expect(resetPasswordSchema.safeParse({ newPassword: 'Password1', confirmPassword: 'Password2' }).success).toBe(false));
});
