import { Component, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { RouterLink } from '@angular/router';
import { validateStandardSchema, form, FormField } from '@angular/forms/signals';
import { AuthLayout } from '../../../layout/auth-layout/auth-layout';
import { firstFieldErrorMessage, getApiErrorMessage } from '@utils';
import { ForgotPasswordModel, forgotPasswordSchema } from './forgot-password.schema';
import { Auth } from '@core/services/auth';
import { AUTH_MESSAGES } from '@constants/messages';
import { BrandMark } from '../../../components/brand-mark/brand-mark';

@Component({
  imports: [
    BrandMark,
    HlmButton,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
    HlmInput,
    RouterLink,
    AuthLayout,
    FormField,
  ],
  selector: 'sl-forgot-password',
  styleUrl: './forgot-password.scss',
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly authApi = inject(Auth);

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
