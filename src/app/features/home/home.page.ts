import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';

import { getApiErrorMessage } from '../../core/api/api-error';
import { type TaskResponseDto, TasksApiService } from '../../core/tasks/tasks-api.service';
import { TASKS_MESSAGES } from '../projects/tasks.messages';
import {
  type ProjectResponseDto,
  ProjectsApiService,
} from '../../core/projects/projects-api.service';
import { UserActions } from '../../core/users/user.actions';
import { selectCurrentUser } from '../../core/users/user.reducer';
import { DASHBOARD_MESSAGES } from './dashboard.messages';

const RECENT_LIMIT = 6 as const;
const MY_WORK_LIMIT = 5 as const;

@Component({
  selector: 'sl-home-page',
  imports: [RouterLink, ...HlmButtonImports, ...HlmCardImports, ...HlmSkeletonImports],
  templateUrl: './home.page.html',
})
export class HomePage implements OnInit {
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly tasksApi = inject(TasksApiService);
  private readonly store = inject(Store);

  readonly messages = DASHBOARD_MESSAGES;
  readonly currentUser = this.store.selectSignal(selectCurrentUser);

  readonly projects = signal<ProjectResponseDto[]>([]);
  readonly totalProjects = signal(0);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  readonly myTasks = signal<TaskResponseDto[]>([]);
  readonly myTasksTotal = signal(0);
  readonly myTasksStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly hiddenMyTasks = computed(() => Math.max(0, this.myTasksTotal() - this.myTasks().length));

  /** Sum of memberCount on the recent page (approximate team presence). */
  readonly recentMemberSeats = computed(() =>
    this.projects().reduce((sum, project) => sum + this.memberCount(project), 0)
  );

  ngOnInit(): void {
    if (!this.currentUser()) {
      this.store.dispatch(UserActions.loadMe());
    }
    this.load();
  }

  loadMyWork(): void {
    this.myTasksStatus.set('loading');
    this.tasksApi.findMine({ page: 1, limit: MY_WORK_LIMIT }).subscribe({
      next: (response) => {
        this.myTasks.set(response.data);
        this.myTasksTotal.set(response.meta.total);
        this.myTasksStatus.set('success');
      },
      // "My work" is a bonus panel: failing must not block the projects below
      error: () => this.myTasksStatus.set('error'),
    });
  }

  load(): void {
    this.loadMyWork();
    this.loadStatus.set('loading');
    this.loadError.set(null);

    this.projectsApi.findAll({ page: 1, limit: RECENT_LIMIT }).subscribe({
      next: (response) => {
        this.projects.set(response.data);
        this.totalProjects.set(response.meta.total);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });
  }

  greeting(): string {
    const name = this.currentUser()?.name?.trim();
    const hour = new Date().getHours();
    let plain: string;
    let named: string;

    if (hour < 12) {
      plain = this.messages.greetingMorning;
      named = this.messages.greetingMorningNamed;
    } else if (hour < 18) {
      plain = this.messages.greetingAfternoon;
      named = this.messages.greetingAfternoonNamed;
    } else {
      plain = this.messages.greetingEvening;
      named = this.messages.greetingEveningNamed;
    }

    if (!name) {
      return plain;
    }
    return named.replace('{name}', name);
  }

  priorityLabel(task: TaskResponseDto): string {
    return TASKS_MESSAGES.priority[task.priority];
  }

  /** "Today", "Tomorrow", a short date, or null when there is no due date. */
  dueLabel(task: TaskResponseDto): string | null {
    if (!task.dueDate) {
      return null;
    }
    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) {
      return null;
    }
    const days = this.dayDiff(due);
    if (days === 0) {
      return this.messages.myWork.today;
    }
    if (days === 1) {
      return this.messages.myWork.tomorrow;
    }
    return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  isOverdue(task: TaskResponseDto): boolean {
    return !!task.dueDate && task.status !== 'DONE' && this.dayDiff(new Date(task.dueDate)) < 0;
  }

  /** 0-100, or null when the project has no tasks (list view only). */
  progressPercent(project: ProjectResponseDto): number | null {
    const total = project.taskCount ?? 0;
    if (total === 0) {
      return null;
    }
    return Math.round(((project.doneTaskCount ?? 0) / total) * 100);
  }

  private dayDiff(date: Date): number {
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.round((startOf(date) - startOf(new Date())) / 86_400_000);
  }

  /** Stable pastel tone (0-3) per project, so each gets its own color. */
  projectTone(project: ProjectResponseDto): string {
    let hash = 0;
    for (const char of project.id) {
      hash = (hash * 31 + char.charCodeAt(0)) % 4;
    }
    return `sl-tone-${hash}`;
  }

  memberCount(project: ProjectResponseDto): number {
    return project.memberCount ?? project.members?.length ?? 0;
  }

  projectInitial(project: ProjectResponseDto): string {
    const name = project.name?.trim();
    if (!name) {
      return '?';
    }
    return name.slice(0, 1).toUpperCase();
  }
}
