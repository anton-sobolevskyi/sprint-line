import { Component, inject, signal } from '@angular/core';
import { AuthLayout } from '../../../layout/auth-layout/auth-layout';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { RETURN_URL_PARAM, sanitizeReturnUrl } from '../../../core/auth/return-url';
import { getApiErrorMessage } from '../../../core/api/api-error';
import { AUTH_MESSAGES } from '../../../constants';
import { z } from 'zod';
import { firstFieldErrorMessage } from '../../../utils';

const messages = AUTH_MESSAGES.validation;

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: messages.emailRequired })
    .email({ message: messages.emailInvalid }),
  password: z.string().min(1, { message: messages.passwordRequired }).min(8, {
    message: messages.passwordMinLength,
  }),
});

type LoginFormModel = z.infer<typeof loginFormSchema>;

@Component({
  imports: [
    AuthLayout,
    HlmButton,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
    HlmInput,
    RouterLink,
    FormField,
  ],
  selector: 'sl-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly messages = AUTH_MESSAGES;
  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly showErrors = signal(false);

  private readonly model = signal<LoginFormModel>({
    email: '',
    password: '',
  });

  readonly loginForm = form(this.model, (schemaPath) => {
    validateStandardSchema(schemaPath, loginFormSchema);
  });

  emailError(): string | null {
    if (!this.showErrors() && !this.loginForm.email().touched()) {
      return null;
    }
    return firstFieldErrorMessage(this.loginForm.email().errors());
  }

  passwordError(): string | null {
    if (!this.showErrors() && !this.loginForm.password().touched()) {
      return null;
    }
    return firstFieldErrorMessage(this.loginForm.password().errors());
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.serverError.set(null);
    this.showErrors.set(true);

    if (this.loginForm().invalid() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const { email, password } = this.model();

    this.authApi.login({ email, password }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        const returnUrl = sanitizeReturnUrl(
          this.route.snapshot.queryParamMap.get(RETURN_URL_PARAM)
        );
        void this.router.navigateByUrl(returnUrl ?? '/');
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.serverError.set(getApiErrorMessage(error));
      },
    });
  }
}
