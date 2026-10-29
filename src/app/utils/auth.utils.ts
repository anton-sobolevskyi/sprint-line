export interface PasswordRuleCheck {
  readonly label: string;
  readonly ok: boolean;
}

/** Live checks that mirror the backend password rule (8+ chars, a letter, a number). */
export function passwordRuleChecks(
  password: string,
  labels: { readonly length: string; readonly letter: string; readonly number: string }
): PasswordRuleCheck[] {
  return [
    { label: labels.length, ok: password.length >= 8 },
    { label: labels.letter, ok: /[A-Za-z]/.test(password) },
    { label: labels.number, ok: /\d/.test(password) },
  ];
}
