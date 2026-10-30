import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authFeature } from '../../../store/auth/auth.reducer';
import { userFeature } from '../../../core/users/user.reducer';
import { UserActions } from '../../../core/users/user.actions';
import { Store } from '@ngrx/store';
import { ProjectMembers as ProjectMembersService } from '@core/services/project-members';
import { Dialog } from '@core/services/dialog';
import { ProjectMembers } from './project-members';

describe('ProjectMembers component', () => {
  let fixture: ComponentFixture<ProjectMembers>;
  const membersApi = {
    findAll: vi.fn(() => of({ data: [], meta: { total: 0 } })),
    add: vi.fn(() => of({ id: 'm1' })),
    updateRole: vi.fn(() => of({ id: 'm1' })),
    remove: vi.fn(() => of({ id: 'm1' })),
    transferOwnership: vi.fn(() => of({ id: 'm1' })),
  };
  const dialog = { confirm: vi.fn(() => of(true)) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectMembers],
      providers: [
        provideRouter([]),
        provideStore({ [authFeature.name]: authFeature.reducer, [userFeature.name]: userFeature.reducer }),
        { provide: ProjectMembersService, useValue: membersApi },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();

    const store = TestBed.inject(Store);
    store.dispatch(UserActions.setCurrentUser({ user: { id: 'u1', name: 'Ada', email: 'a@b.co' } as never }));

    fixture = TestBed.createComponent(ProjectMembers);
    fixture.componentRef.setInput('projectId', 'p1');
    fixture.detectChanges();
  });

  it('renders', () => {
    expect(fixture).toBeTruthy();
  });

  it('utility methods', () => {
    const c = fixture.componentInstance;
    c.displayName({ name: 'Ada', email: 'a@b.co', userId: 'u1' } as never);
    c.displayEmail({ name: 'Ada', email: 'a@b.co', userId: 'u1' } as never);
    c.memberInitials({ userId:'u1', user:{ name:'Ada Lovelace', email:'a@b.co' } } as never);
    c.roleLabel('ADMIN');
    c.isSelf({ userId: 'u2' } as never);
    c.inviteFieldError('email');
    c.roleValue({ userId:'u1', role:'MEMBER' } as never);
    c.setInviteRole('ADMIN');
  });

  it('onInviteSubmit', () => {
    const c = fixture.componentInstance;
    (c as unknown as { inviteModel: { set: (v: unknown) => void } }).inviteModel.set({ email: 'a@b.co', role: 'MEMBER' });
    const event = new Event('submit');
    vi.spyOn(event, 'preventDefault');
    c.onInviteSubmit(event);
  });

  it('onRoleChange', () => {
    const c = fixture.componentInstance;
    const member = { userId: 'u2', role: 'MEMBER' } as never;
    c.onRoleChange(member, 'ADMIN');
  });

  it('onRemove', async () => {
    const c = fixture.componentInstance;
    const member = { userId: 'u2', role: 'MEMBER' } as never;
    c.onRemove(member);
    await new Promise((r) => setTimeout(r, 0));
  });

  it('onTransferOwnership', async () => {
    const c = fixture.componentInstance;
    const member = { userId: 'u2', role: 'ADMIN' } as never;
    c.onTransfer(member);
    await new Promise((r) => setTimeout(r, 0));
  });

  it('memberInitials email fallback', () => {
    const c = fixture.componentInstance;
    c.memberInitials({ userId: 'u1', user: { name: '', email: 'ab@x.co' } } as never);
  });
});
