import { z } from 'zod';

import { AUTH_MESSAGES, PASSWORD_LETTER_AND_NUMBER } from '../../../constants';

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, { message: AUTH_MESSAGES.validation.passwordRequired })
      .min(8, { message: AUTH_MESSAGES.validation.passwordMinLength })
      .regex(PASSWORD_LETTER_AND_NUMBER, {
        message: AUTH_MESSAGES.validation.passwordPattern,
      }),
    confirmPassword: z.string().min(1, { message: AUTH_MESSAGES.validation.confirmRequired }),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: AUTH_MESSAGES.validation.passwordMismatch,
    path: ['confirmPassword'],
  });

export type ResetPasswordModel = z.infer<typeof resetPasswordSchema>;
