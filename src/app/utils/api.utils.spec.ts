import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { API_BASE_URL, API_PATHS } from '@constants/api';
import {
  API_ERROR_MESSAGES,
  apiUrl,
  getApiErrorCode,
  getApiErrorMessage,
  isApiRequestUrl,
  isAuthPublicRequestUrl,
} from './api.utils';

describe('getApiErrorMessage', () => {
  it('returns fallback for non-HTTP errors', () => {
    expect(getApiErrorMessage(new Error('x'))).toBe(API_ERROR_MESSAGES.generic);
  });

  it('returns network message for status 0', () => {
    const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown' });
    expect(getApiErrorMessage(error)).toBe(API_ERROR_MESSAGES.network);
  });

  it('prefers API body message string', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Email already used' },
    });
    expect(getApiErrorMessage(error)).toBe('Email already used');
  });

  it('joins array messages', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: ['A', 'B'] },
    });
    expect(getApiErrorMessage(error)).toBe('A B');
  });
});

describe('getApiErrorCode', () => {
  it('reads code from the body', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { code: 'CONFLICT' },
    });
    expect(getApiErrorCode(error)).toBe('CONFLICT');
  });
});

describe('api URL helpers', () => {
  it('builds absolute API URLs', () => {
    expect(apiUrl('/projects')).toBe(`${API_BASE_URL}/projects`);
  });

  it('detects API request URLs', () => {
    expect(isApiRequestUrl(`${API_BASE_URL}/projects`)).toBe(true);
    expect(isApiRequestUrl('https://example.com')).toBe(false);
  });

  it('detects public auth endpoints', () => {
    expect(isAuthPublicRequestUrl(`${API_BASE_URL}${API_PATHS.auth.login}`)).toBe(true);
    expect(isAuthPublicRequestUrl(`${API_BASE_URL}/projects`)).toBe(false);
  });
});
