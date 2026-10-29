import { z } from 'zod';
import { AUTH_MESSAGES } from '@constants/messages';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: AUTH_MESSAGES.validation.emailRequired })
    .email({ message: AUTH_MESSAGES.validation.emailInvalid }),
});

export type ForgotPasswordModel = z.infer<typeof forgotPasswordSchema>;
