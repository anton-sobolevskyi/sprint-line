import { describe, expect, it } from 'vitest';

import { API_BASE_URL, API_ENDPOINTS, API_PATHS, AUTH_PUBLIC_PATHS } from './api';

describe('api constants', () => {
  it('defines base url and paths', () => {
    expect(API_BASE_URL).toBeTruthy();
    expect(API_PATHS.projects.byId('1')).toBe('/projects/1');
    expect(API_PATHS.projects.members('p')).toBe('/projects/p/members');
    expect(API_PATHS.projects.member('p', 'u')).toBe('/projects/p/members/u');
    expect(API_PATHS.projects.transferOwnership('p', 'u')).toBe('/projects/p/members/u/transfer-ownership');
    expect(API_PATHS.projects.tasks('p')).toBe('/projects/p/tasks');
    expect(API_PATHS.tasks.byId('t')).toBe('/tasks/t');
    expect(API_PATHS.tasks.comments('t')).toBe('/tasks/t/comments');
    expect(API_PATHS.tasks.attachments('t')).toBe('/tasks/t/attachments');
    expect(API_PATHS.comments.byId('c')).toBe('/comments/c');
    expect(API_PATHS.comments.attachments('c')).toBe('/comments/c/attachments');
    expect(API_PATHS.attachments.byId('a')).toBe('/attachments/a');
    expect(API_PATHS.attachments.download('a')).toBe('/attachments/a/download');
    expect(AUTH_PUBLIC_PATHS).toContain('/auth/login');
    expect(API_ENDPOINTS.auth.login).toBeTruthy();
    expect(API_ENDPOINTS.projects.byId('1')).toBeTruthy();
    expect(API_ENDPOINTS.tasks.byId('t')).toBeTruthy();
    expect(API_ENDPOINTS.comments.byId('c')).toBeTruthy();
    expect(API_ENDPOINTS.attachments.downloadUrl('a')).toBeTruthy();
  });
});