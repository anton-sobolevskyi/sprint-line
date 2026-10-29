import { z } from 'zod';
import { PROFILE_MESSAGES } from '@constants/messages';
import { PASSWORD_LETTER_AND_NUMBER } from '@constants/config';

export const profileDetailsSchema = z.object({
  name: z
    .string()
    .min(1, { message: PROFILE_MESSAGES.validation.nameRequired })
    .min(2, { message: PROFILE_MESSAGES.validation.nameMinLength }),
  email: z
    .string()
    .min(1, { message: PROFILE_MESSAGES.validation.emailRequired })
    .email({ message: PROFILE_MESSAGES.validation.emailInvalid }),
  /** Required by API when email changes; optional otherwise. */
  currentPassword: z.string(),
});

export type ProfileDetailsModel = z.infer<typeof profileDetailsSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: PROFILE_MESSAGES.validation.currentPasswordRequired }),
    newPassword: z
      .string()
      .min(1, { message: PROFILE_MESSAGES.validation.newPasswordRequired })
      .min(8, { message: PROFILE_MESSAGES.validation.newPasswordMinLength })
      .regex(PASSWORD_LETTER_AND_NUMBER, {
        message: PROFILE_MESSAGES.validation.newPasswordPattern,
      }),
    confirmPassword: z.string().min(1, { message: PROFILE_MESSAGES.validation.confirmRequired }),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: PROFILE_MESSAGES.passwordSection.mismatch,
    path: ['confirmPassword'],
  });

export type ChangePasswordModel = z.infer<typeof changePasswordSchema>;
