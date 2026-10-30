import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { authFeature } from '../../../store/auth/auth.reducer';
import { userFeature } from '../../../core/users/user.reducer';
import { UserActions } from '../../../core/users/user.actions';

import { Projects } from '@core/services/projects';
import { Dialog } from '@core/services/dialog';
import { ProjectDetail } from './project-detail';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ProjectDetail', () => {
  let fixture: ComponentFixture<ProjectDetail>;
  const projectsApi = {
    findOne: vi.fn(() => of({ id: 'p1', name: 'Project', description: '' })),
    update: vi.fn(() => of({ id: 'p1', name: 'Project2' })),
    softDelete: vi.fn(() => of({ id: 'p1' })),
  };
  const dialog = { confirm: vi.fn(() => of(true)) };

  beforeEach(async () => {
    const route = {
      paramMap: of({ get: (k: string) => (k === 'id' ? 'p1' : null) }),
      queryParamMap: of({ get: (k: string) => null }),
      snapshot: { paramMap: { get: (k: string) => (k === 'id' ? 'p1' : null) } },
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        provideRouter([]),
        provideStore({ [authFeature.name]: authFeature.reducer, [userFeature.name]: userFeature.reducer }),
        { provide: ActivatedRoute, useValue: route },
        { provide: Projects, useValue: projectsApi },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();

    const store = TestBed.inject(Store);
    store.dispatch(UserActions.setCurrentUser({ user: { id: 'u1', name: 'Ada', email: 'a@b.co' } as never }));

    fixture = TestBed.createComponent(ProjectDetail);
    fixture.detectChanges();
  });

  it('loads project', () => {
    expect(projectsApi.findOne).toHaveBeenCalled();
  });

  it('utility methods', () => {
    const c = fixture.componentInstance;
    c.setTab('members');
    c.load("p1");
    c.reload();
    c.settingsFieldError('name');
  });

  it('onSaveSettings', () => {
    const c = fixture.componentInstance;
    (c as unknown as { settingsModel: { set: (v: unknown) => void } }).settingsModel.set({ name: 'Project2', description: '' });
    const event = new Event('submit');
    vi.spyOn(event, 'preventDefault');
    c.onSaveSettings(event);
  });

  it('onDeleteConfirmInput', () => {
    const c = fixture.componentInstance;
    c.onDeleteConfirmInput({ target: { value: 'Project' } } as never);
  });
});
