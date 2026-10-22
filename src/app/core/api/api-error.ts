import { HttpErrorResponse } from '@angular/common/http';

import { API_ERROR_MESSAGES } from '../messages/api-error.messages';

/**
 * Backend error body shape (see management_app_backend README):
 * `{ statusCode, code, message, timestamp, path, requestId }`
 * `message` is a string or string[] for validation errors.
 */
export interface ApiErrorBody {
  statusCode?: number;
  code?: string;
  message?: string | string[];
  timestamp?: string;
  path?: string;
  requestId?: string;
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string = API_ERROR_MESSAGES.generic,
): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const body = error.error;
  if (!isApiErrorBody(body) || body.message == null) {
    if (error.status === 0) {
      return API_ERROR_MESSAGES.network;
    }
    return fallback;
  }

  return Array.isArray(body.message) ? body.message.join(' ') : body.message;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!(error instanceof HttpErrorResponse)) {
    return undefined;
  }
  const body = error.error;
  return isApiErrorBody(body) ? body.code : undefined;
}
