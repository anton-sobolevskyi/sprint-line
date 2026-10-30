import { describe, expect, it } from 'vitest';
import { profileDetailsSchema, changePasswordSchema } from './profile.schema';
describe('profile schemas', () => {
  it('details valid', () => expect(profileDetailsSchema.safeParse({ name: 'Ada', email: 'a@b.co', currentPassword: '' }).success).toBe(true));
  it('change password valid', () => expect(changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'Password1', confirmPassword: 'Password1' }).success).toBe(true));
  it('change password mismatch', () => expect(changePasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'Password1', confirmPassword: 'Password2' }).success).toBe(false));
});
