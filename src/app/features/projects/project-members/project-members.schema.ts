import { z } from 'zod';
import { MEMBERS_MESSAGES } from '@constants/messages';

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, { message: MEMBERS_MESSAGES.validation.emailRequired })
    .email({ message: MEMBERS_MESSAGES.validation.emailInvalid }),
  role: z.enum(['ADMIN', 'MEMBER'], {
    message: MEMBERS_MESSAGES.validation.roleRequired,
  }),
});

export type InviteMemberModel = z.infer<typeof inviteMemberSchema>;
