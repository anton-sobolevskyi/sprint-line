import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Projects } from '@core/services/projects';
import type { ProjectResponseDto } from '@types';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { ProjectsList } from './projects-list';

function project(id: string, name: string, description = ''): ProjectResponseDto {
  return {
    id,
    name,
    description,
    taskCount: 4,
    doneTaskCount: 1,
    memberCount: 2,
  } as ProjectResponseDto;
}

describe('ProjectsList', () => {
  let fixture: ComponentFixture<ProjectsList>;
  let component: ProjectsList;

  const projectsApi = {
    findAll: vi.fn(),
  };

  const dialog = {
    open: vi.fn(() => ({ closed$: of(undefined) })),
  };

  beforeEach(async () => {
    projectsApi.findAll.mockReset();
    dialog.open.mockClear();
    projectsApi.findAll.mockReturnValue(of({ data: [], meta: { total: 0, page: 1, limit: 20 } }));

    await TestBed.configureTestingModule({
      imports: [ProjectsList],
      providers: [
        provideRouter([]),
        { provide: Projects, useValue: projectsApi },
        { provide: HlmDialogService, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsList);
    component = fixture.componentInstance;
  });

  it('loads projects on init', () => {
    projectsApi.findAll.mockReturnValue(
      of({
        data: [project('1', 'Alpha'), project('2', 'Beta')],
        meta: { total: 2, page: 1, limit: 20 },
      })
    );

    fixture.detectChanges();

    expect(projectsApi.findAll).toHaveBeenCalled();
    expect(component.loadStatus()).toBe('success');
    expect(component.projects()).toHaveLength(2);

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Alpha');
    expect(root.textContent).toContain('Beta');
  });

  it('shows empty state when API returns no projects', () => {
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(component.messages.list.emptyTitle);
  });

  it('filters visible projects by search text', () => {
    projectsApi.findAll.mockReturnValue(
      of({
        data: [project('1', 'Website'), project('2', 'Mobile App')],
        meta: { total: 2, page: 1, limit: 20 },
      })
    );

    fixture.detectChanges();
    component.onSearch({ target: { value: 'mobile' } } as unknown as Event);
    fixture.detectChanges();

    expect(component.visibleProjects().map((p) => p.name)).toEqual(['Mobile App']);
  });

  it('shows a no-match message when search has no hits', () => {
    projectsApi.findAll.mockReturnValue(
      of({
        data: [project('1', 'Website')],
        meta: { total: 1, page: 1, limit: 20 },
      })
    );

    fixture.detectChanges();
    component.search.set('zzzz');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(component.messages.list.noMatchTitle);
  });

  it('shows an error alert when load fails', () => {
    projectsApi.findAll.mockReturnValue(throwError(() => new Error('offline')));

    fixture.detectChanges();

    expect(component.loadStatus()).toBe('error');
    expect(component.loadError()).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).toBeTruthy();
  });

  it('openCreate opens the create dialog once', () => {
    fixture.detectChanges();
    component.openCreate();
    component.openCreate();

    expect(dialog.open).toHaveBeenCalledTimes(1);
  });

  it('progressPercent returns null when the project has no tasks', () => {
    expect(component.progressPercent(project('1', 'Empty'))).not.toBeNull();
    const empty = { ...project('2', 'None'), taskCount: 0, doneTaskCount: 0 };
    expect(component.progressPercent(empty)).toBeNull();
  });
});
