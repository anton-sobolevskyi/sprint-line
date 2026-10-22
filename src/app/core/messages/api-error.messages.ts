/**
 * User-facing API error copy.
 * Keep keys stable for future i18n (e.g. ngx-translate / @angular/localize).
 */
export const API_ERROR_MESSAGES = {
  generic: 'Something went wrong. Please try again.',
  network: 'Unable to reach the server. Check your connection.',
} as const;

export type ApiErrorMessageKey = keyof typeof API_ERROR_MESSAGES;
