import { z } from 'zod';
import { AUTH_MESSAGES } from '@constants/messages';

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: AUTH_MESSAGES.validation.emailRequired })
    .email({ message: AUTH_MESSAGES.validation.emailInvalid }),
  password: z.string().min(1, { message: AUTH_MESSAGES.validation.passwordRequired }).min(8, {
    message: AUTH_MESSAGES.validation.passwordMinLength,
  }),
});

export type LoginFormModel = z.infer<typeof loginFormSchema>;
