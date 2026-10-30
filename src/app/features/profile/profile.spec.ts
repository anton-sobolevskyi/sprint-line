import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authFeature } from '../../store/auth/auth.reducer';
import { userFeature } from '../../core/users/user.reducer';
import { UserActions } from '../../core/users/user.actions';
import { Store } from '@ngrx/store';
import { Users } from '@core/services/users';
import { Auth } from '@core/services/auth';
import { Session } from '@core/services/session';
import { Dialog } from '@core/services/dialog';
import { Profile } from './profile';

describe('Profile', () => {
  let fixture: ComponentFixture<Profile>;
  const usersApi = {
    getMe: vi.fn(() => of({ id: 'u1', name: 'Ada', email: 'a@b.co' })),
    updateMe: vi.fn(() => of({ id: 'u1', name: 'Ada', email: 'a@b.co' })),
    changePassword: vi.fn(() => of(null)),
    uploadAvatar: vi.fn(() => of({ id: 'att1' })),
    getAttachmentDownloadUrl: vi.fn(() => of({ url: 'http://x' })),
  };
  const authApi = { resendVerification: vi.fn(() => of(null)) };
  const session = { clearSession: vi.fn() };
  const dialog = { confirm: vi.fn(() => of(true)) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideStore({
          [authFeature.name]: authFeature.reducer,
          [userFeature.name]: userFeature.reducer,
        }),
        { provide: Users, useValue: usersApi },
        { provide: Auth, useValue: authApi },
        { provide: Session, useValue: session },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();

    const store = TestBed.inject(Store);
    store.dispatch(
      UserActions.setCurrentUser({ user: { id: 'u1', name: 'Ada', email: 'a@b.co' } as never })
    );

    fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();
  });

  it('renders', () => {
    expect(fixture).toBeTruthy();
  });

  it('utility methods', () => {
    const c = fixture.componentInstance;
    c.isEmailVerified();
    c.reload();
    c.detailsFieldError('name');
    c.passwordFieldError('newPassword');
  });

  it('onSaveDetails', () => {
    const c = fixture.componentInstance;
    (c as unknown as { detailsModel: { set: (v: unknown) => void } }).detailsModel.set({
      name: 'Ada',
      email: 'a@b.co',
      currentPassword: '',
    });
    const event = new Event('submit');
    vi.spyOn(event, 'preventDefault');
    c.onSaveDetails(event);
  });

  it('onChangePassword', () => {
    const c = fixture.componentInstance;
    (c as unknown as { passwordModel: { set: (v: unknown) => void } }).passwordModel.set({
      currentPassword: 'old',
      newPassword: 'Password1',
      confirmPassword: 'Password1',
    });
    const event = new Event('submit');
    vi.spyOn(event, 'preventDefault');
    c.onChangePassword(event);
  });

  it('onResendVerification', () => {
    const c = fixture.componentInstance;
    c.onResendVerification();
  });

  it('onAvatarSelected', () => {
    const c = fixture.componentInstance;
    const input = document.createElement('input');
    input.type = 'file';
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: [file] });
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: input });
    c.onAvatarSelected(event);
  });

  it('onDeletePasswordInput', () => {
    const c = fixture.componentInstance;
    c.onDeletePasswordInput({ target: { value: 'pw' } } as never);
  });
});
