import { describe, expect, it } from 'vitest';

import { isGuestUrl, sanitizeReturnUrl } from './route.utils';

describe('sanitizeReturnUrl', () => {
  it('rejects empty, external, and protocol-relative values', () => {
    expect(sanitizeReturnUrl(null)).toBeNull();
    expect(sanitizeReturnUrl('')).toBeNull();
    expect(sanitizeReturnUrl('https://evil.example')).toBeNull();
    expect(sanitizeReturnUrl('//evil.example')).toBeNull();
    expect(sanitizeReturnUrl('/\\evil')).toBeNull();
  });

  it('rejects home and guest auth routes', () => {
    expect(sanitizeReturnUrl('/')).toBeNull();
    expect(sanitizeReturnUrl('/login')).toBeNull();
    expect(sanitizeReturnUrl('/login?x=1')).toBeNull();
    expect(sanitizeReturnUrl('/register')).toBeNull();
  });

  it('keeps safe in-app deep links', () => {
    expect(sanitizeReturnUrl('/projects')).toBe('/projects');
    expect(sanitizeReturnUrl('/projects/1/tasks')).toBe('/projects/1/tasks');
  });
});

describe('isGuestUrl', () => {
  it('matches guest prefixes', () => {
    expect(isGuestUrl('/login')).toBe(true);
    expect(isGuestUrl('/register/extra')).toBe(true);
    expect(isGuestUrl('/projects')).toBe(false);
  });
});
