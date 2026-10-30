import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { authFeature } from '../../../store/auth/auth.reducer';
import { userFeature } from '../../../core/users/user.reducer';
import { UserActions } from '../../../core/users/user.actions';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Tasks } from '@core/services/tasks';
import { ProjectMembers } from '@core/services/project-members';
import { Dialog } from '@core/services/dialog';
import { ProjectTasks } from './project-tasks';

describe('ProjectTasks', () => {
  let fixture: ComponentFixture<ProjectTasks>;
  const tasksApi = {
    findAll: vi.fn(() => of({ data: [], meta: { total: 0 } })),
    create: vi.fn(() => of({ id: 't1' })),
    update: vi.fn(() => of({ id: 't1' })),
    remove: vi.fn(() => of({ id: 't1' })),
  };
  const membersApi = {
    findAll: vi.fn(() => of({ data: [], meta: { total: 0 } })),
  };
  const dialog = { confirm: vi.fn(() => of(true)) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTasks],
      providers: [
        provideStore({ [authFeature.name]: authFeature.reducer, [userFeature.name]: userFeature.reducer }),
        { provide: Tasks, useValue: tasksApi },
        { provide: ProjectMembers, useValue: membersApi },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();

    const store = TestBed.inject(Store);
    store.dispatch(UserActions.setCurrentUser({ user: { id: 'u1', name: 'Ada', email: 'a@b.co' } as never }));

    fixture = TestBed.createComponent(ProjectTasks);
    fixture.componentRef.setInput('projectId', 'p1');
    fixture.detectChanges();
  });

  it('renders', () => {
    expect(fixture).toBeTruthy();
  });

  it('utility methods', () => {
    const c = fixture.componentInstance;
    c.setViewMode('list');
    c.load();
    c.clearFilters();
    c.toggleAssignedToMe();
    c.toggleOverdue();
    c.onSearchInput({ target: { value: 'q' } } as never);
    c.openCreate();
    c.closeCreate();
    c.dueLabel({ id:'t1', title:'Task', status:'TODO', priority:'MEDIUM', dueDate:'2024-01-01T00:00:00Z' } as never);
    c.isOverdue({ id:'t1', title:'Task', status:'TODO', priority:'MEDIUM', dueDate:'2024-01-01T00:00:00Z' } as never);
    c.assigneeName({ id:'t1', title:'Task', status:'TODO', priority:'MEDIUM', assignedToId:'u1' } as never);
    c.assigneeInitials({ id:'t1', title:'Task', status:'TODO', priority:'MEDIUM', assignedToId:'u1' } as never);
    c.statusLabel('TODO');
    c.priorityLabel('HIGH');
    c.priorityChipClass('HIGH');
    c.onStatusChange({ id: 't1' } as never, 'DONE');
  });

  it('onDocumentKeydown', () => {
    const c = fixture.componentInstance;
    const event = new KeyboardEvent('keydown', { key: 'n' });
    vi.spyOn(event, 'preventDefault');
    c.onDocumentKeydown(event);
    const event2 = new KeyboardEvent('keydown', { key: 'Escape' });
    c.onDocumentKeydown(event2);
  });
});
