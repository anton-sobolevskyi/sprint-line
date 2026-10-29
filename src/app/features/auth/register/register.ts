import { Component, computed, inject, signal } from '@angular/core';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { Router, RouterLink } from '@angular/router';
import { AUTH_MESSAGES } from '../auth.messages';
import { RegisterFormModel, registerFormSchema } from '../auth.schemas';
import { firstFieldErrorMessage, passwordRuleChecks } from '../auth.form-utils';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { getApiErrorMessage } from '../../../core/api/api-error';
import { AuthLayout } from '../../../layout/auth-layout/auth-layout';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  imports: [AuthLayout, HlmInputImports, HlmFieldImports, FormField, HlmButtonImports, RouterLink],
  selector: 'sl-register',
  styleUrl: './register.scss',
  templateUrl: './register.html',
})
export class Register {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly messages = AUTH_MESSAGES;
  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly showErrors = signal(false);

  private readonly model = signal<RegisterFormModel>({
    name: '',
    email: '',
    password: '',
  });

  readonly passwordRules = computed(() =>
    passwordRuleChecks(this.model().password, this.messages.rules)
  );

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
