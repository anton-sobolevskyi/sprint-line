import { Component, inject, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { getApiErrorMessage } from '../../../core/api/api-error';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { firstFieldErrorMessage } from '../auth.form-utils';
import { AUTH_MESSAGES } from '../auth.messages';
import {
  resetPasswordSchema,
  type ResetPasswordModel,
} from '../auth.schemas';

@Component({
  selector: 'sl-reset-password-page',
  imports: [
    FormField,
    RouterLink,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
  ],
  templateUrl: './reset-password.page.html',
})
export class ResetPasswordPage {
  private readonly authApi = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);

  readonly messages = AUTH_MESSAGES;
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showErrors = signal(false);

  readonly token = signal(
    this.route.snapshot.queryParamMap.get('token')?.trim() ?? '',
  );

  private readonly model = signal<ResetPasswordModel>({
    newPassword: '',
    confirmPassword: '',
  });

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
