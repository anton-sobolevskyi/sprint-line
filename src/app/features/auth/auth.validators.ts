import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

/** Matches backend register rules: 8+ chars, at least one letter and one number. */
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const AUTH_VALIDATORS = {
  email: [Validators.required, Validators.email],
  passwordLogin: [Validators.required, Validators.minLength(8)],
  passwordRegister: [
    Validators.required,
    Validators.minLength(8),
    Validators.pattern(PASSWORD_PATTERN),
  ],
  name: [Validators.required, Validators.minLength(2)],
} as const;

export function controlErrorKey(control: AbstractControl | null): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) {
    return null;
  }

  const errors: ValidationErrors = control.errors;
  if (errors['required']) {
    return 'required';
  }
  if (errors['email']) {
    return 'email';
  }
  if (errors['minlength']) {
    return 'minlength';
  }
  if (errors['pattern']) {
    return 'pattern';
  }
  return null;
}
