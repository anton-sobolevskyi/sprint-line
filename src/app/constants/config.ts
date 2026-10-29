import type { TaskPriority } from '@types';

export const RECENT_LIMIT = 6 as const;
export const MY_WORK_LIMIT = 20 as const;
export const COMMENTS_DEFAULT_LIMIT = 50 as const;
export const MEMBERS_LIMIT = 100 as const;

export const DEFAULT_PAGE = 1 as const;
export const PROJECTS_LIMIT = 20 as const;

export const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const PASSWORD_LETTER_AND_NUMBER = /^(?=.*[A-Za-z])(?=.*\d).*$/;

export const ATTACHMENT_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxPerComment: 10,
  mimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'text/plain',
  ],
} as const;

export const ATTACHMENT_ACCEPT = ATTACHMENT_LIMITS.mimeTypes.join(',');

export const TASK_STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;

export const PRIORITY_RANK: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const RETURN_URL_PARAM = 'returnUrl' as const;

export const GUEST_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/not-found',
];

export const STORAGE_KEY = 'sprintline-theme';
