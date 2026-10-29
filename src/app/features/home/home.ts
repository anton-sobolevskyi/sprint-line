import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  type ProjectResponseDto,
  ProjectsApiService,
} from '../../core/projects/projects-api.service';
import { type TaskResponseDto, TasksApiService } from '../../core/tasks/tasks-api.service';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../core/users/user.reducer';
import { UserActions } from '../../core/users/user.actions';
import { getApiErrorMessage } from '../../core/api/api-error';
import { DASHBOARD_MESSAGES, MY_WORK_LIMIT, RECENT_LIMIT, TASKS_MESSAGES } from '../../constants';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';

@Component({
  imports: [RouterLink, HlmButtonImports, HlmSkeletonImports],
  selector: 'sl-home',
  styleUrl: './home.scss',
  templateUrl: './home.html',
})
export class Home implements OnInit {
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

  readonly overdueCount = computed(() => this.myTasks().filter((t) => this.isOverdue(t)).length);

  readonly dueThisWeekCount = computed(
    () =>
      this.myTasks().filter((t) => {
        const days = this.taskDays(t);
        return days !== null && days >= 0 && days < 7;
      }).length
  );

  readonly inProgressCount = computed(
    () => this.myTasks().filter((t) => t.status === 'IN_PROGRESS').length
  );

  /** One-line summary under the greeting, built from the loaded tasks. */
  readonly summary = computed(() => {
    if (this.myTasksStatus() !== 'success') {
      return this.messages.subtitle;
    }
    const parts: string[] = [];
    const overdue = this.overdueCount();
    const week = this.dueThisWeekCount();
    if (overdue > 0) {
      parts.push(this.messages.summary.overdue.replace('{n}', String(overdue)));
    }
    if (week > 0) {
      parts.push(this.messages.summary.week.replace('{n}', String(week)));
    }
    return parts.length > 0
      ? parts.join(this.messages.summary.joiner)
      : this.messages.summary.allClear;
  });

  /** My tasks grouped by due date (the API already returns them soonest first). */
  readonly taskGroups = computed(() => {
    const groups = [
      { key: 'overdue', label: this.messages.groups.overdue, tasks: [] as TaskResponseDto[] },
      { key: 'week', label: this.messages.groups.week, tasks: [] as TaskResponseDto[] },
      { key: 'later', label: this.messages.groups.later, tasks: [] as TaskResponseDto[] },
      { key: 'none', label: this.messages.groups.none, tasks: [] as TaskResponseDto[] },
    ];
    for (const task of this.myTasks()) {
      const days = this.taskDays(task);
      if (days === null) {
        groups[3]!.tasks.push(task);
      } else if (days < 0 && task.status !== 'DONE') {
        groups[0]!.tasks.push(task);
      } else if (days < 7) {
        groups[1]!.tasks.push(task);
      } else {
        groups[2]!.tasks.push(task);
      }
    }
    return groups.filter((group) => group.tasks.length > 0);
  });

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

  statusLabel(task: TaskResponseDto): string {
    return TASKS_MESSAGES.status[task.status];
  }

  progressText(project: ProjectResponseDto): string {
    return this.messages.recent.done
      .replace('{done}', String(project.doneTaskCount ?? 0))
      .replace('{total}', String(project.taskCount ?? 0));
  }

  memberText(project: ProjectResponseDto): string {
    const count = this.memberCount(project);
    return `${count} ${count === 1 ? this.messages.recent.member : this.messages.recent.members}`;
  }

  /** Whole days from today to the due date, or null without a valid due date. */
  private taskDays(task: TaskResponseDto): number | null {
    if (!task.dueDate) {
      return null;
    }
    const due = new Date(task.dueDate);
    return Number.isNaN(due.getTime()) ? null : this.dayDiff(due);
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
