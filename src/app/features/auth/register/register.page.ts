import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { getApiErrorMessage } from '../../../core/api/api-error';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { AUTH_MESSAGES } from '../auth.messages';
import { AUTH_VALIDATORS, controlErrorKey } from '../auth.validators';

@Component({
  selector: 'sl-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
  ],
  templateUrl: './register.page.html',
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly messages = AUTH_MESSAGES;
  readonly isSubmitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', AUTH_VALIDATORS.name],
    email: ['', AUTH_VALIDATORS.email],
    password: ['', AUTH_VALIDATORS.passwordRegister],
  });

  nameError(): string | null {
    const key = controlErrorKey(this.form.controls.name);
    if (key === 'required') {
      return this.messages.validation.nameRequired;
    }
    if (key === 'minlength') {
      return this.messages.validation.nameMinLength;
    }
    return null;
  }

  emailError(): string | null {
    const key = controlErrorKey(this.form.controls.email);
    if (key === 'required') {
      return this.messages.validation.emailRequired;
    }
    if (key === 'email') {
      return this.messages.validation.emailInvalid;
    }
    return null;
  }

  passwordError(): string | null {
    const key = controlErrorKey(this.form.controls.password);
    if (key === 'required') {
      return this.messages.validation.passwordRequired;
    }
    if (key === 'minlength') {
      return this.messages.validation.passwordMinLength;
    }
    if (key === 'pattern') {
      return this.messages.validation.passwordPattern;
    }
    return null;
  }

  onSubmit(): void {
    this.serverError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const { name, email, password } = this.form.getRawValue();

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
