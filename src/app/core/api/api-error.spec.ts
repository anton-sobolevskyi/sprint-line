import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { API_ERROR_MESSAGES } from '../messages/api-error.messages';
import { getApiErrorCode, getApiErrorMessage, isApiErrorBody } from './api-error';

describe('api-error helpers', () => {
  it('detects API error bodies', () => {
    expect(isApiErrorBody({ message: 'x', code: 'NOT_FOUND' })).toBe(true);
    expect(isApiErrorBody(null)).toBe(false);
    expect(isApiErrorBody('plain')).toBe(false);
  });

  it('reads string message from HttpErrorResponse', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: 'Email already registered', code: 'CONFLICT' },
    });
    expect(getApiErrorMessage(error)).toBe('Email already registered');
    expect(getApiErrorCode(error)).toBe('CONFLICT');
  });

  it('joins validation message arrays', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { message: ['email must be an email', 'password too short'] },
    });
    expect(getApiErrorMessage(error)).toBe(
      'email must be an email password too short',
    );
  });

  it('handles network failures with message constant', () => {
    const error = new HttpErrorResponse({ status: 0, error: null });
    expect(getApiErrorMessage(error)).toBe(API_ERROR_MESSAGES.network);
  });

  it('uses generic fallback for non-HTTP errors', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBe(API_ERROR_MESSAGES.generic);
  });
});
