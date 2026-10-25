import { z } from 'zod';

import { PROFILE_MESSAGES } from './profile.messages';

const messages = PROFILE_MESSAGES.validation;
const PASSWORD_LETTER_AND_NUMBER = /^(?=.*[A-Za-z])(?=.*\d).*$/;

export const profileDetailsSchema = z.object({
  name: z
    .string()
    .min(1, { message: messages.nameRequired })
    .min(2, { message: messages.nameMinLength }),
  email: z
    .string()
    .min(1, { message: messages.emailRequired })
    .email({ message: messages.emailInvalid }),
  /** Required by API when email changes; optional otherwise. */
  currentPassword: z.string(),
});

export type ProfileDetailsModel = z.infer<typeof profileDetailsSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: messages.currentPasswordRequired }),
    newPassword: z
      .string()
      .min(1, { message: messages.newPasswordRequired })
      .min(8, { message: messages.newPasswordMinLength })
      .regex(PASSWORD_LETTER_AND_NUMBER, {
        message: messages.newPasswordPattern,
      }),
    confirmPassword: z.string().min(1, { message: messages.confirmRequired }),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: PROFILE_MESSAGES.passwordSection.mismatch,
    path: ['confirmPassword'],
  });

export type ChangePasswordModel = z.infer<typeof changePasswordSchema>;
