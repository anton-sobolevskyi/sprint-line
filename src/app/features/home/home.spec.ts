import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Projects } from '@core/services/projects';
import { Tasks } from '@core/services/tasks';
import type { ProjectResponseDto, TaskResponseDto } from '@types';
import { UserActions } from '../../core/users/user.actions';
import { userFeature } from '../../core/users/user.reducer';
import { Home } from './home';

function project(id: string, name: string): ProjectResponseDto {
  return { id, name, description: null } as ProjectResponseDto;
}

function task(id: string, status: TaskResponseDto['status'] = 'TODO'): TaskResponseDto {
  return { id, title: `Task ${id}`, status, priority: 'MEDIUM' } as TaskResponseDto;
}

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;
  let store: Store;

  const projectsApi = {
    findAll: vi.fn(),
  };
  const tasksApi = {
    findMine: vi.fn(),
  };

  beforeEach(async () => {
    projectsApi.findAll.mockReset();
    tasksApi.findMine.mockReset();
    projectsApi.findAll.mockReturnValue(of({ data: [], meta: { total: 0 } }));
    tasksApi.findMine.mockReturnValue(of({ data: [], meta: { total: 0 } }));

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore({ [userFeature.name]: userFeature.reducer }),
        { provide: Projects, useValue: projectsApi },
        { provide: Tasks, useValue: tasksApi },
      ],
    }).compileComponents();

    store = TestBed.inject(Store);
    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  it('dispatches loadMe when no current user is in the store', () => {
    const spy = vi.spyOn(store, 'dispatch');

    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith(UserActions.loadMe());
  });

  it('loads projects and my tasks on init', () => {
    projectsApi.findAll.mockReturnValue(
      of({ data: [project('p1', 'Alpha')], meta: { total: 1 } })
    );
    tasksApi.findMine.mockReturnValue(
      of({ data: [task('t1', 'IN_PROGRESS')], meta: { total: 1 } })
    );

    fixture.detectChanges();

    expect(projectsApi.findAll).toHaveBeenCalled();
    expect(tasksApi.findMine).toHaveBeenCalled();
    expect(component.loadStatus()).toBe('success');
    expect(component.projects()).toHaveLength(1);
    expect(component.myTasksStatus()).toBe('success');
    expect(component.inProgressCount()).toBe(1);
  });

  it('shows onboarding when there are no projects', () => {
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(component.messages.onboarding.title);
  });

  it('renders recent project names after a successful load', () => {
    projectsApi.findAll.mockReturnValue(
      of({ data: [project('p1', 'Website Redesign')], meta: { total: 1 } })
    );

    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Website Redesign');
    expect(component.totalProjects()).toBe(1);
  });

  it('shows a projects error alert and keeps my-work failure isolated', () => {
    projectsApi.findAll.mockReturnValue(throwError(() => new Error('projects down')));
    tasksApi.findMine.mockReturnValue(throwError(() => new Error('tasks down')));

    fixture.detectChanges();

    expect(component.loadStatus()).toBe('error');
    expect(component.loadError()).toBeTruthy();
    expect(component.myTasksStatus()).toBe('error');

    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
  });

  it('retry calls load again', () => {
    projectsApi.findAll.mockReturnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();

    projectsApi.findAll.mockReturnValue(
      of({ data: [project('p2', 'Beta')], meta: { total: 1 } })
    );
    component.load();
    fixture.detectChanges();

    expect(component.loadStatus()).toBe('success');
    expect(component.projects()[0]?.name).toBe('Beta');
  });
});
