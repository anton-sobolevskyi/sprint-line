import { Component, inject, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { getApiErrorMessage } from '../../../core/api/api-error';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { RETURN_URL_PARAM, sanitizeReturnUrl } from '../../../core/auth/return-url';
import { AuthThemeToggle } from '../auth-theme-toggle.component';
import { firstFieldErrorMessage } from '../auth.form-utils';
import { AUTH_MESSAGES } from '../auth.messages';
import { loginFormSchema, type LoginFormModel } from '../auth.schemas';

@Component({
  selector: 'sl-login-page',
  imports: [
    FormField,
    RouterLink,
    AuthThemeToggle,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
  ],
  templateUrl: './login.page.html',
})
export class LoginPage {
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
