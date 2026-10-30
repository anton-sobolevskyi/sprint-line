import { describe, expect, it } from 'vitest';
import { inviteMemberSchema } from './project-members.schema';
describe('inviteMemberSchema', () => {
  it('valid', () => expect(inviteMemberSchema.safeParse({ email: 'a@b.co', role: 'MEMBER' }).success).toBe(true));
  it('invalid', () => expect(inviteMemberSchema.safeParse({ email: '', role: 'MEMBER' }).success).toBe(false));
});
