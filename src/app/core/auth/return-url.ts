/** Query param used to send the user back after signing in. */
export const RETURN_URL_PARAM = 'returnUrl' as const;

const GUEST_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/not-found',
];

/**
 * Accepts only same-app absolute paths. Rejects protocol-relative (`//evil.com`),
 * absolute URLs, backslash tricks and guest pages (so we never loop back to login).
 */
export function sanitizeReturnUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.includes('\\')) {
    return null;
  }
  if (url === '/') {
    return null;
  }
  if (
    GUEST_PREFIXES.some(
      (prefix) => url === prefix || url.startsWith(`${prefix}?`) || url.startsWith(`${prefix}/`)
    )
  ) {
    return null;
  }
  return url;
}

export function isGuestUrl(url: string): boolean {
  return GUEST_PREFIXES.some(
    (prefix) => url === prefix || url.startsWith(`${prefix}?`) || url.startsWith(`${prefix}/`)
  );
}
