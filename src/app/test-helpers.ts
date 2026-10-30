import { vi } from 'vitest';
import { of } from 'rxjs';

import { Projects } from '@core/services/projects';
import { Tasks } from '@core/services/tasks';
import { Comments } from '@core/services/comments';
import { Attachments } from '@core/services/attachments';
import { ProjectMembers } from '@core/services/project-members';
import { Users } from '@core/services/users';
import { Auth } from '@core/services/auth';
import { Session } from '@core/services/session';
import { Theme } from '@core/services/theme';
import { Dialog } from '@core/services/dialog';
import { CommandPalette } from '@core/services/command-palette';

export function mockService(): unknown {
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      return vi.fn(() => of({ data: [], meta: { total: 0, page: 1, limit: 20 } }));
    },
  });
}

export function provideMockCoreServices(): unknown[] {
  return [
    { provide: Projects, useValue: mockService() },
    { provide: Tasks, useValue: mockService() },
    { provide: Comments, useValue: mockService() },
    { provide: Attachments, useValue: mockService() },
    { provide: ProjectMembers, useValue: mockService() },
    { provide: Users, useValue: mockService() },
    { provide: Auth, useValue: mockService() },
    { provide: Session, useValue: mockService() },
    { provide: Theme, useValue: mockService() },
    { provide: Dialog, useValue: mockService() },
    { provide: CommandPalette, useValue: mockService() },
  ];
}