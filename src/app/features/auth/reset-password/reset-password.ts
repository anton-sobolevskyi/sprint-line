import { Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { FormField, validateStandardSchema, form } from '@angular/forms/signals';
import { getApiErrorMessage } from '../../../core/api/api-error';
import { AuthLayout } from '../../../layout/auth-layout/auth-layout';
import { z } from 'zod';
import { AUTH_MESSAGES, PASSWORD_LETTER_AND_NUMBER } from '../../../constants';
import { firstFieldErrorMessage, passwordRuleChecks } from '../../../utils';

const messages = AUTH_MESSAGES.validation;

const resetPasswordSchema = z
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

type ResetPasswordModel = z.infer<typeof resetPasswordSchema>;

@Component({
  imports: [
    HlmButton,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
    HlmInput,
    RouterLink,
    AuthLayout,
    FormField,
  ],
  selector: 'sl-reset-password',
  styleUrl: './reset-password.scss',
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);

  readonly messages = AUTH_MESSAGES;
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showErrors = signal(false);

  readonly token = signal(this.route.snapshot.queryParamMap.get('token')?.trim() ?? '');

  private readonly model = signal<ResetPasswordModel>({
    newPassword: '',
    confirmPassword: '',
  });

  readonly passwordRules = computed(() =>
    passwordRuleChecks(this.model().newPassword, this.messages.rules)
  );

  readonly form = form(this.model, (schemaPath) => {
    validateStandardSchema(schemaPath, resetPasswordSchema);
  });

  passwordError(): string | null {
    if (!this.showErrors() && !this.form.newPassword().touched()) {
      return null;
    }
    return firstFieldErrorMessage(this.form.newPassword().errors());
  }

  confirmError(): string | null {
    if (!this.showErrors() && !this.form.confirmPassword().touched()) {
      return null;
    }
    return firstFieldErrorMessage(this.form.confirmPassword().errors());
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.serverError.set(null);
    this.successMessage.set(null);
    this.showErrors.set(true);

    const token = this.token();
    if (!token) {
      this.serverError.set(this.messages.resetPassword.missingToken);
      return;
    }

    if (this.form().invalid() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const { newPassword } = this.model();

    this.authApi.resetPassword({ token, newPassword }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(this.messages.resetPassword.success);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.serverError.set(getApiErrorMessage(error));
      },
    });
  }
}
