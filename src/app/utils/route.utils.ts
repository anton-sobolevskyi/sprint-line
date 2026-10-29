import { GUEST_PREFIXES } from '@constants/config';

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
