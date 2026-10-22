import { environment } from '../../../environments/environment';

/** Backend origin from environment (no trailing slash). */
export const API_BASE_URL = environment.apiUrl;

/**
 * Path segments relative to API_BASE_URL.
 * Use with `apiUrl()` or the prebuilt `API_ENDPOINTS` map.
 */
export const API_PATHS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
  users: {
    me: '/users/me',
    mePassword: '/users/me/password',
    avatar: '/users/avatar',
  },
  attachments: {
    download: (id: string) => `/attachments/${id}/download-url` as const,
  },
} as const;

export type ApiAuthPath = (typeof API_PATHS.auth)[keyof typeof API_PATHS.auth];

/** Absolute URLs for HTTP calls. */
export const API_ENDPOINTS = {
  auth: {
    register: apiUrl(API_PATHS.auth.register),
    login: apiUrl(API_PATHS.auth.login),
    refresh: apiUrl(API_PATHS.auth.refresh),
    logout: apiUrl(API_PATHS.auth.logout),
  },
  users: {
    me: apiUrl(API_PATHS.users.me),
    mePassword: apiUrl(API_PATHS.users.mePassword),
    avatar: apiUrl(API_PATHS.users.avatar),
  },
  attachments: {
    downloadUrl: (id: string) => apiUrl(API_PATHS.attachments.download(id)),
  },
} as const;

/** Auth routes that must not trigger the 401 refresh-retry loop. */
export const AUTH_PUBLIC_PATHS = [
  API_PATHS.auth.register,
  API_PATHS.auth.login,
  API_PATHS.auth.refresh,
  API_PATHS.auth.logout,
] as const;

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function isApiRequestUrl(url: string): boolean {
  return url.startsWith(API_BASE_URL);
}

export function isAuthPublicRequestUrl(url: string): boolean {
  return AUTH_PUBLIC_PATHS.some((path) => url.includes(path));
}
