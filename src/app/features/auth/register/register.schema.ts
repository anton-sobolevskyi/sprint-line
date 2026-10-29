import { z } from 'zod';
import { AUTH_MESSAGES } from '@constants/messages';
import { PASSWORD_LETTER_AND_NUMBER } from '@constants/config';

export const registerFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: AUTH_MESSAGES.validation.nameRequired })
    .min(2, { message: AUTH_MESSAGES.validation.nameMinLength }),
  email: z
    .string()
    .min(1, { message: AUTH_MESSAGES.validation.emailRequired })
    .email({ message: AUTH_MESSAGES.validation.emailInvalid }),
  password: z
    .string()
    .min(1, { message: AUTH_MESSAGES.validation.passwordRequired })
    .min(8, { message: AUTH_MESSAGES.validation.passwordMinLength })
    .regex(PASSWORD_LETTER_AND_NUMBER, {
      message: AUTH_MESSAGES.validation.passwordPattern,
    }),
});

export type RegisterFormModel = z.infer<typeof registerFormSchema>;
