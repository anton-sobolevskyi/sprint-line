import { Component, inject, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { getApiErrorMessage } from '../../../core/api/api-error';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { firstFieldErrorMessage } from '../auth.form-utils';
import { AUTH_MESSAGES } from '../auth.messages';
import { registerFormSchema, type RegisterFormModel } from '../auth.schemas';

@Component({
  selector: 'sl-register-page',
  imports: [
    FormField,
    RouterLink,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
  ],
  templateUrl: './register.page.html',
})
export class RegisterPage {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly messages = AUTH_MESSAGES;
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly showErrors = signal(false);

  private readonly model = signal<RegisterFormModel>({
    name: '',
    email: '',
    password: '',
  });

  readonly registerForm = form(this.model, (schemaPath) => {
    validateStandardSchema(schemaPath, registerFormSchema);
  });

  nameError(): string | null {
    if (!this.showErrors() && !this.registerForm.name().touched()) {
      return null;
    }
    return firstFieldErrorMessage(this.registerForm.name().errors());
  }

  emailError(): string | null {
    if (!this.showErrors() && !this.registerForm.email().touched()) {
      return null;
    }
    return firstFieldErrorMessage(this.registerForm.email().errors());
  }

  passwordError(): string | null {
    if (!this.showErrors() && !this.registerForm.password().touched()) {
      return null;
    }
    return firstFieldErrorMessage(this.registerForm.password().errors());
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.serverError.set(null);
    this.showErrors.set(true);

    if (this.registerForm().invalid() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const { name, email, password } = this.model();

    this.authApi.register({ name, email, password }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.serverError.set(getApiErrorMessage(error));
      },
    });
  }
}
