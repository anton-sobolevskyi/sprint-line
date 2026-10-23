import { z } from 'zod';

import { MEMBERS_MESSAGES } from './members.messages';

const messages = MEMBERS_MESSAGES.validation;

/** Invite roles — ownership is transferred via a dedicated endpoint. */
export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, { message: messages.emailRequired })
    .email({ message: messages.emailInvalid }),
  role: z.enum(['ADMIN', 'MEMBER'], {
    message: messages.roleRequired,
  }),
});

export type InviteMemberModel = z.infer<typeof inviteMemberSchema>;
