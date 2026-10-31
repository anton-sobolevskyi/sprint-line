import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { authFeature } from '../../../store/auth/auth.reducer';
import { userFeature } from '../../../core/users/user.reducer';
import { UserActions } from '../../../core/users/user.actions';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { Tasks } from '@core/services/tasks';
import { ProjectMembers } from '@core/services/project-members';
import { Dialog } from '@core/services/dialog';
import { TaskDetail } from './task-detail';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('TaskDetail', () => {
  let fixture: ComponentFixture<TaskDetail>;
  const tasksApi = {
    findOne: vi.fn(() =>
      of({
        id: 't1',
        title: 'Task',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '',
        assignedToId: '',
      })
    ),
    update: vi.fn(() => of({ id: 't1' })),
  };
  const membersApi = {
    findAll: vi.fn(() => of({ data: [], meta: { total: 0 } })),
  };
  const dialog = { confirm: vi.fn(() => of(true)) };

  beforeEach(async () => {
    const route = {
      paramMap: of({ get: (k: string) => (k === 'taskId' ? 't1' : null) }),
      parent: { paramMap: of({ get: (k: string) => (k === 'id' ? 'p1' : null) }) },
      snapshot: { paramMap: { get: (k: string) => (k === 'taskId' ? 't1' : null) } },
    };

    await TestBed.configureTestingModule({
      imports: [TaskDetail],
      providers: [
        provideRouter([]),
        provideStore({
          [authFeature.name]: authFeature.reducer,
          [userFeature.name]: userFeature.reducer,
        }),
        { provide: ActivatedRoute, useValue: route },
        { provide: Tasks, useValue: tasksApi },
        { provide: ProjectMembers, useValue: membersApi },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();

    const store = TestBed.inject(Store);
    store.dispatch(
      UserActions.setCurrentUser({ user: { id: 'u1', name: 'Ada', email: 'a@b.co' } as never })
    );

    fixture = TestBed.createComponent(TaskDetail);
    fixture.detectChanges();
  });

  it('loads task', () => {
    expect(tasksApi.findOne).toHaveBeenCalled();
  });

  it('utility methods', () => {
    const c = fixture.componentInstance;
    c.memberLabel({ userId: 'u1', role: 'MEMBER' } as never);
    c.priorityLabel('HIGH');
    c.editStatus();
    c.editPriority();
    c.editAssigneeId();
    c.setEditStatus('DONE');
    c.setEditPriority('HIGH');
    c.setEditAssignee('u1');
    c.fieldError('title');
  });

  it('onEscape', () => {
    const c = fixture.componentInstance;
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    vi.spyOn(event, 'preventDefault');
    c.onEscape();
  });

  it('reload', () => {
    const c = fixture.componentInstance;
    c.reload();
    expect(tasksApi.findOne).toHaveBeenCalled();
  });

  it('onSave', () => {
    const c = fixture.componentInstance;
    (c as unknown as { model: { set: (v: unknown) => void } }).model.set({
      title: 'Task',
      description: '',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: '',
      assignedToId: '',
    });
    const event = new Event('submit');
    vi.spyOn(event, 'preventDefault');
    c.onSave(event);
  });
});
