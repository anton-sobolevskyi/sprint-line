/** First validation error message from a Signal Forms field state, if any. */
export function firstFieldErrorMessage(
  errors: ReadonlyArray<{ message?: string } | null | undefined> | undefined,
): string | null {
  if (!errors?.length) {
    return null;
  }

  const message = errors[0]?.message;
  return message && message.length > 0 ? message : null;
}
