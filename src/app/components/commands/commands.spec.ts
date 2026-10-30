import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandPalette } from '@core/services/command-palette';
import { Theme } from '@core/services/theme';
import { Projects } from '@core/services/projects';
import { Tasks } from '@core/services/tasks';
import { Commands } from './commands';

describe('Commands', () => {
  let fixture: ComponentFixture<Commands>;
  const paletteService = new (class {
    open = () => true;
    show = vi.fn();
    hide = vi.fn();
  })();
  const theme = { toggleLightDark: vi.fn() };
  const projectsApi = { findAll: vi.fn(() => of({ data: [], meta: { total: 0 } })) };
  const tasksApi = { findAll: vi.fn(() => of({ data: [], meta: { total: 0 } })) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Commands],
      providers: [
        provideRouter([]),
        { provide: CommandPalette, useValue: paletteService },
        { provide: Theme, useValue: theme },
        { provide: Projects, useValue: projectsApi },
        { provide: Tasks, useValue: tasksApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Commands);
    fixture.componentRef.setInput('recentProjects', []);
    fixture.componentRef.setInput('onSignOut', () => undefined);
    fixture.detectChanges();
  });

  it('renders', () => {
    expect(fixture).toBeTruthy();
  });

  it('calls computed', () => {
    const c = fixture.componentInstance;
    c.query.set('test');
    c.activeIndex.set(1);
    c.filtered();
    c.grouped();
    c.commands();
  });
});
