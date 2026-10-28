import { describe, expect, it } from 'vitest';

import { isGuestUrl, sanitizeReturnUrl } from './return-url';

describe('sanitizeReturnUrl', () => {
  it('keeps in-app paths with query strings', () => {
    expect(sanitizeReturnUrl('/projects/1?tab=members')).toBe('/projects/1?tab=members');
  });

  it('rejects empty, root and non-path values', () => {
    expect(sanitizeReturnUrl(null)).toBeNull();
    expect(sanitizeReturnUrl('')).toBeNull();
    expect(sanitizeReturnUrl('/')).toBeNull();
    expect(sanitizeReturnUrl('projects')).toBeNull();
  });

  it('rejects open-redirect attempts', () => {
    expect(sanitizeReturnUrl('//evil.com')).toBeNull();
    expect(sanitizeReturnUrl('https://evil.com')).toBeNull();
    expect(sanitizeReturnUrl('/\\evil.com')).toBeNull();
  });

  it('rejects guest pages to avoid redirect loops', () => {
    expect(sanitizeReturnUrl('/login')).toBeNull();
    expect(sanitizeReturnUrl('/login?returnUrl=%2Fx')).toBeNull();
    expect(sanitizeReturnUrl('/register')).toBeNull();
  });
});

describe('isGuestUrl', () => {
  it('detects guest routes', () => {
    expect(isGuestUrl('/login')).toBe(true);
    expect(isGuestUrl('/login?returnUrl=%2Fprojects')).toBe(true);
    expect(isGuestUrl('/projects')).toBe(false);
  });
});
