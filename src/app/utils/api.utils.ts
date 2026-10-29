import { HttpErrorResponse } from '@angular/common/http';
import { API_BASE_URL, AUTH_PUBLIC_PATHS } from '@constants/api';

export const API_ERROR_MESSAGES = {
  generic: 'Something went wrong. Please try again.',
  network: 'Unable to reach the server. Check your connection.',
} as const;

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
  fallback: string = API_ERROR_MESSAGES.generic
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

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function isApiRequestUrl(url: string): boolean {
  return url.startsWith(API_BASE_URL);
}

export function isAuthPublicRequestUrl(url: string): boolean {
  if (!isApiRequestUrl(url)) {
    return false;
  }
  const path = url.slice(API_BASE_URL.length).split(/[?#]/)[0];
  return (AUTH_PUBLIC_PATHS as readonly string[]).includes(path ?? '');
}
