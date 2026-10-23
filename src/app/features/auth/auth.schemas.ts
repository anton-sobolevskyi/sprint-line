import { z } from 'zod';

import { AUTH_MESSAGES } from './auth.messages';

const messages = AUTH_MESSAGES.validation;

/** At least one letter and one number (backend register / reset rule). */
const PASSWORD_LETTER_AND_NUMBER = /^(?=.*[A-Za-z])(?=.*\d).*$/;

export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: messages.emailRequired })
    .email({ message: messages.emailInvalid }),
  password: z.string().min(1, { message: messages.passwordRequired }).min(8, {
    message: messages.passwordMinLength,
  }),
});

export type LoginFormModel = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: messages.nameRequired })
    .min(2, { message: messages.nameMinLength }),
  email: z
    .string()
    .min(1, { message: messages.emailRequired })
    .email({ message: messages.emailInvalid }),
  password: z
    .string()
    .min(1, { message: messages.passwordRequired })
    .min(8, { message: messages.passwordMinLength })
    .regex(PASSWORD_LETTER_AND_NUMBER, {
      message: messages.passwordPattern,
    }),
});

export type RegisterFormModel = z.infer<typeof registerFormSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: messages.emailRequired })
    .email({ message: messages.emailInvalid }),
});

export type ForgotPasswordModel = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, { message: messages.passwordRequired })
      .min(8, { message: messages.passwordMinLength })
      .regex(PASSWORD_LETTER_AND_NUMBER, {
        message: messages.passwordPattern,
      }),
    confirmPassword: z.string().min(1, { message: messages.confirmRequired }),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: messages.passwordMismatch,
    path: ['confirmPassword'],
  });

export type ResetPasswordModel = z.infer<typeof resetPasswordSchema>;
