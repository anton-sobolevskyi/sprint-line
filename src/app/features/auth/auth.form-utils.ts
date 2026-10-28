/** First validation error message from a Signal Forms field state, if any. */
export function firstFieldErrorMessage(
  errors: ReadonlyArray<{ message?: string } | null | undefined> | undefined
): string | null {
  if (!errors?.length) {
    return null;
  }

  const message = errors[0]?.message;
  return message && message.length > 0 ? message : null;
}

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
