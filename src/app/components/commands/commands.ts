import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { HlmInput } from '@spartan-ng/helm/input';
import { Router } from '@angular/router';
import { CommandGroup, CommandItem } from './commands.types';
import { Tasks } from '@core/services/tasks';
import { Projects } from '@core/services/projects';
import { ProjectResponseDto, TaskResponseDto } from '@types';
import { SHELL_MESSAGES } from '@constants/messages';
import { PROJECTS_LIMIT } from '@constants/config';
import { CommandPalette } from '@core/services/command-palette';
import { Theme } from '@core/services/theme';

@Component({
  imports: [HlmInput],
  selector: 'sl-commands',
  styleUrl: './commands.scss',
  templateUrl: './commands.html',
})
export class Commands {
  /** Recent projects from the shell (fallback while full list loads). */
  readonly recentProjects = input<ProjectResponseDto[]>([]);

  /** Sign-out handler provided by the shell. */
  readonly onSignOut = input<() => void>(() => undefined);

  private readonly palette = inject(CommandPalette);
  private readonly router = inject(Router);
  private readonly theme = inject(Theme);
  private readonly projectsApi = inject(Projects);
  private readonly tasksApi = inject(Tasks);

  readonly messages = SHELL_MESSAGES.commandPalette;

  readonly shortcutHint =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent)
      ? SHELL_MESSAGES.commandPalette.triggerHintMac
      : SHELL_MESSAGES.commandPalette.triggerHint;
  readonly groupLabels = {
    nav: SHELL_MESSAGES.commandPalette.groupNav,
    tasks: SHELL_MESSAGES.commandPalette.groupTasks,
    projects: SHELL_MESSAGES.commandPalette.groupProjects,
    actions: SHELL_MESSAGES.commandPalette.groupActions,
  } as const;

  readonly isOpen = this.palette.open;
  readonly query = signal('');
  readonly activeIndex = signal(0);

  /** Full project list for search (loaded when palette opens). */
  private readonly searchableProjects = signal<ProjectResponseDto[]>([]);
  readonly projectsLoading = signal(false);

  /** Task hits for the project the user is currently inside (server-side search). */
  private readonly taskHits = signal<{ projectId: string; tasks: TaskResponseDto[] }>({
    projectId: '',
    tasks: [],
  });

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private projectsLoadedOnce = false;

  readonly commands = computed(() => {
    const items: CommandItem[] = [
      {
        id: 'nav-home',
        group: 'nav',
        label: this.messages.home,
        keywords: 'home dashboard',
        run: () => void this.router.navigateByUrl('/'),
      },
      {
        id: 'nav-projects',
        group: 'nav',
        label: this.messages.projects,
        keywords: 'projects list all',
        run: () => void this.router.navigateByUrl('/projects'),
      },
      {
        id: 'nav-new-project',
        group: 'nav',
        label: this.messages.newProject,
        keywords: 'new create project',
        run: () => void this.router.navigate(['/projects'], { queryParams: { new: '1' } }),
      },
      {
        id: 'nav-profile',
        group: 'nav',
        label: this.messages.profile,
        keywords: 'profile account settings',
        run: () => void this.router.navigateByUrl('/profile'),
      },
    ];

    const hits = this.taskHits();
    for (const task of hits.tasks) {
      items.push({
        id: `task-${task.id}`,
        group: 'tasks',
        label: task.title,
        // The API already matched the query, so keep these hits whatever the label says.
        keywords: `task ${this.query()}`,
        run: () => void this.router.navigate(['/projects', hits.projectId, 'tasks', task.id]),
      });
    }

    const projects =
      this.searchableProjects().length > 0 ? this.searchableProjects() : this.recentProjects();

    for (const project of projects) {
      items.push({
        id: `project-${project.id}`,
        group: 'projects',
        label: this.messages.openProject.replace('{name}', project.name),
        keywords: `project ${project.name} ${project.description ?? ''}`,
        run: () => void this.router.navigate(['/projects', project.id]),
      });
    }

    items.push(
      {
        id: 'action-theme',
        group: 'actions',
        label: this.messages.toggleTheme,
        keywords: 'theme dark light mode',
        run: () => this.theme.toggleLightDark(),
      },
      {
        id: 'action-sign-out',
        group: 'actions',
        label: this.messages.signOut,
        keywords: 'logout sign out exit',
        run: () => this.onSignOut()(),
      }
    );

    return items;
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.commands();
    if (!q) {
      return all;
    }
    return all.filter(
      (item) => item.label.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q)
    );
  });

  readonly grouped = computed(() => {
    const items = this.filtered();
    const order: CommandGroup[] = ['nav', 'tasks', 'projects', 'actions'];
    return order
      .map((group) => ({
        group,
        label: this.groupLabels[group],
        items: items.filter((item) => item.group === group),
      }))
      .filter((section) => section.items.length > 0);
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        return;
      }
      this.query.set('');
      this.activeIndex.set(0);
      queueMicrotask(() => this.searchInput()?.nativeElement.focus());
      this.ensureProjectsLoaded();
    });

    // Debounced task search, only while the user is inside a project.
    effect((onCleanup) => {
      const q = this.query().trim();
      const projectId = this.isOpen() ? this.currentProjectId() : null;
      if (!projectId || q.length < 2) {
        this.taskHits.set({ projectId: '', tasks: [] });
        return;
      }
      const timer = setTimeout(() => {
        const sub = this.tasksApi.findAll(projectId, { q, limit: 5 }).subscribe({
          next: (response) => this.taskHits.set({ projectId, tasks: response.data ?? [] }),
          error: () => this.taskHits.set({ projectId: '', tasks: [] }),
        });
        onCleanup(() => sub.unsubscribe());
      }, 250);
      onCleanup(() => clearTimeout(timer));
    });

    effect(() => {
      const len = this.filtered().length;
      if (this.activeIndex() >= len) {
        this.activeIndex.set(Math.max(0, len - 1));
      }
    });
  }

  /** `/projects/:id/...` -> id, otherwise null. */
  private currentProjectId(): string | null {
    const match = /^\/projects\/([^/?#]+)/.exec(this.router.url);
    return match ? decodeURIComponent(match[1]!) : null;
  }

  private ensureProjectsLoaded(): void {
    if (this.projectsLoadedOnce || this.projectsLoading()) {
      return;
    }
    this.projectsLoading.set(true);
    this.projectsApi.findAll({ page: 1, limit: PROJECTS_LIMIT }).subscribe({
      next: (response) => {
        this.searchableProjects.set(response.data ?? []);
        this.projectsLoadedOnce = true;
        this.projectsLoading.set(false);
      },
      error: () => {
        this.projectsLoading.set(false);
      },
    });
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    const isModK = (event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey);
    if (isModK) {
      event.preventDefault();
      this.palette.toggle();
      return;
    }

    if (!this.isOpen()) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.palette.hide();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const len = this.filtered().length;
      if (len === 0) {
        return;
      }
      this.activeIndex.update((i) => (i + 1) % len);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const len = this.filtered().length;
      if (len === 0) {
        return;
      }
      this.activeIndex.update((i) => (i - 1 + len) % len);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.runActive();
    }
  }

  onQueryInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
  }

  /** Closes only when the backdrop itself is clicked, not when the click bubbles from the dialog. */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.palette.hide();
    }
  }

  runAt(index: number): void {
    const item = this.filtered()[index];
    if (!item) {
      return;
    }
    this.palette.hide();
    item.run();
  }

  runActive(): void {
    this.runAt(this.activeIndex());
  }

  isActive(index: number): boolean {
    return this.activeIndex() === index;
  }

  /** Flat index of an item within the filtered list (for highlighting). */
  flatIndex(item: CommandItem): number {
    return this.filtered().findIndex((c) => c.id === item.id);
  }
}
