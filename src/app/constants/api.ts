import { environment } from '../../environments/environment';
import { apiUrl } from '@utils';

export const API_BASE_URL = environment.apiUrl;

export const API_PATHS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    resendVerification: '/auth/resend-verification',
  },
  users: {
    me: '/users/me',
    mePassword: '/users/me/password',
    meTasks: '/users/me/tasks',
    avatar: '/users/avatar',
  },
  projects: {
    root: '/projects',
    byId: (id: string) => `/projects/${id}` as const,
    members: (projectId: string) => `/projects/${projectId}/members` as const,
    member: (projectId: string, userId: string) =>
      `/projects/${projectId}/members/${userId}` as const,
    transferOwnership: (projectId: string, userId: string) =>
      `/projects/${projectId}/members/${userId}/transfer-ownership` as const,
    tasks: (projectId: string) => `/projects/${projectId}/tasks` as const,
  },
  tasks: {
    byId: (id: string) => `/tasks/${id}` as const,
    comments: (taskId: string) => `/tasks/${taskId}/comments` as const,
    attachments: (taskId: string) => `/tasks/${taskId}/attachments` as const,
  },
  comments: {
    byId: (id: string) => `/comments/${id}` as const,
    attachments: (commentId: string) => `/comments/${commentId}/attachments` as const,
  },
  attachments: {
    byId: (id: string) => `/attachments/${id}` as const,
    download: (id: string) => `/attachments/${id}/download` as const,
  },
} as const;

export const API_ENDPOINTS = {
  auth: {
    register: apiUrl(API_PATHS.auth.register),
    login: apiUrl(API_PATHS.auth.login),
    refresh: apiUrl(API_PATHS.auth.refresh),
    logout: apiUrl(API_PATHS.auth.logout),
    forgotPassword: apiUrl(API_PATHS.auth.forgotPassword),
    resetPassword: apiUrl(API_PATHS.auth.resetPassword),
    verifyEmail: apiUrl(API_PATHS.auth.verifyEmail),
    resendVerification: apiUrl(API_PATHS.auth.resendVerification),
  },
  users: {
    me: apiUrl(API_PATHS.users.me),
    mePassword: apiUrl(API_PATHS.users.mePassword),
    meTasks: apiUrl(API_PATHS.users.meTasks),
    avatar: apiUrl(API_PATHS.users.avatar),
  },
  projects: {
    list: apiUrl(API_PATHS.projects.root),
    create: apiUrl(API_PATHS.projects.root),
    byId: (id: string) => apiUrl(API_PATHS.projects.byId(id)),
    members: (projectId: string) => apiUrl(API_PATHS.projects.members(projectId)),
    member: (projectId: string, userId: string) =>
      apiUrl(API_PATHS.projects.member(projectId, userId)),
    transferOwnership: (projectId: string, userId: string) =>
      apiUrl(API_PATHS.projects.transferOwnership(projectId, userId)),
    tasks: (projectId: string) => apiUrl(API_PATHS.projects.tasks(projectId)),
  },
  tasks: {
    byId: (id: string) => apiUrl(API_PATHS.tasks.byId(id)),
    comments: (taskId: string) => apiUrl(API_PATHS.tasks.comments(taskId)),
    attachments: (taskId: string) => apiUrl(API_PATHS.tasks.attachments(taskId)),
  },
  comments: {
    byId: (id: string) => apiUrl(API_PATHS.comments.byId(id)),
    attachments: (commentId: string) => apiUrl(API_PATHS.comments.attachments(commentId)),
  },
  attachments: {
    byId: (id: string) => apiUrl(API_PATHS.attachments.byId(id)),
    downloadUrl: (id: string) => apiUrl(API_PATHS.attachments.download(id)),
  },
} as const;

export const AUTH_PUBLIC_PATHS = [
  API_PATHS.auth.register,
  API_PATHS.auth.login,
  API_PATHS.auth.refresh,
  API_PATHS.auth.logout,
  API_PATHS.auth.forgotPassword,
  API_PATHS.auth.resetPassword,
  API_PATHS.auth.verifyEmail,
] as const;
