import { Component, inject, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { getApiErrorMessage } from '../../../core/api/api-error';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { firstFieldErrorMessage } from '../auth.form-utils';
import { AUTH_MESSAGES } from '../auth.messages';
import {
  forgotPasswordSchema,
  type ForgotPasswordModel,
} from '../auth.schemas';

@Component({
  selector: 'sl-forgot-password-page',
  imports: [
    FormField,
    RouterLink,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
  ],
  templateUrl: './forgot-password.page.html',
})
export class ForgotPasswordPage {
  private readonly authApi = inject(AuthApiService);

  readonly messages = AUTH_MESSAGES;
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly showErrors = signal(false);

  private readonly model = signal<ForgotPasswordModel>({ email: '' });

  readonly form = form(this.model, (schemaPath) => {
    validateStandardSchema(schemaPath, forgotPasswordSchema);
  });

  emailError(): string | null {
    if (!this.showErrors() && !this.form.email().touched()) {
      return null;
    }
    return firstFieldErrorMessage(this.form.email().errors());
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.serverError.set(null);
    this.successMessage.set(null);
    this.showErrors.set(true);

    if (this.form().invalid() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const { email } = this.model();

    this.authApi.forgotPassword({ email }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(this.messages.forgotPassword.success);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.serverError.set(getApiErrorMessage(error));
      },
    });
  }
}
