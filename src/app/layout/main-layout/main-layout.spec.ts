import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { authFeature } from '../../store/auth/auth.reducer';
import { userFeature } from '../../core/users/user.reducer';
import { UserActions } from '../../core/users/user.actions';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Auth } from '@core/services/auth';
import { Projects } from '@core/services/projects';
import { Users } from '@core/services/users';
import { CommandPalette } from '@core/services/command-palette';
import { Theme } from '@core/services/theme';
import { MainLayout } from './main-layout';

describe('MainLayout', () => {
  let fixture: ComponentFixture<MainLayout>;
  const authApi = { logout: vi.fn(() => of(void 0)) };
  const projectsApi = { findAll: vi.fn(() => of({ data: [], meta: { total: 0 } })) };
  const usersApi = { getAttachmentDownloadUrl: vi.fn(() => of({ url: 'http://x' })) };
  const commandPalette = new (class { open = () => false; show = vi.fn(); hide = vi.fn(); })();
  const theme = { toggleLightDark: vi.fn(), mode: () => 'light', resolved: () => 'light' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        provideStore({ [authFeature.name]: authFeature.reducer, [userFeature.name]: userFeature.reducer }),
        { provide: Auth, useValue: authApi },
        { provide: Projects, useValue: projectsApi },
        { provide: Users, useValue: usersApi },
        { provide: CommandPalette, useValue: commandPalette },
        { provide: Theme, useValue: theme },
      ],
    }).compileComponents();

    const store = TestBed.inject(Store);
    store.dispatch(UserActions.setCurrentUser({ user: { id: 'u1', name: 'Ada', email: 'a@b.co' } as never }));

    fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();
  });

  it('renders', () => {
    expect(fixture).toBeTruthy();
  });

  it('calls methods', () => {
    const c = fixture.componentInstance;
    c.logout();
  });
});
