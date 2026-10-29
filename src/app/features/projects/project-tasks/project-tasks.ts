import {
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

import { ProjectTasksStore } from './project-tasks.store';

import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../../core/users/user.reducer';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { UserActions } from '../../../core/users/user.actions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TaskCreateDialog } from '../../../components/task-create-dialog/task-create-dialog';
import { UI_MESSAGES } from '../../../core/ui/ui.messages';
import { appToast } from '../../../core/ui/toast';
import { RouterLink } from '@angular/router';
import { TasksViewMode } from './project-tasks.types';
import { isEditableTarget } from '../../../utils';
import { TaskCreateDialogData } from '../../../components/task-create-dialog/task-create-dialog.types';
import { ProjectMembers } from '@core/services/project-members';
import { ProjectMemberResponseDto, TaskResponseDto, TaskStatus, TaskPriority } from '@types';
import { TASKS_MESSAGES } from '@constants/messages';
import { MEMBERS_LIMIT, PRIORITY_RANK, TASK_STATUS_ORDER } from '@constants/config';
import { Dialog } from '@core/services/dialog';

@Component({
  imports: [HlmButton, HlmInput, HlmSkeleton, RouterLink],
  selector: 'sl-project-tasks',
  styleUrl: './project-tasks.scss',
  templateUrl: './project-tasks.html',
  providers: [ProjectTasksStore],
})
export class ProjectTasks {
  readonly projectId = input.required<string>();

  private readonly tasksStore = inject(ProjectTasksStore);
  private readonly membersApi = inject(ProjectMembers);
  private readonly dialog = inject(Dialog);
  private readonly ngrxStore = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  readonly messages = TASKS_MESSAGES;
  readonly statusOrder = TASK_STATUS_ORDER;

  readonly currentUser = this.ngrxStore.selectSignal(selectCurrentUser);

  readonly tasks = this.tasksStore.tasks;
  readonly loadStatus = this.tasksStore.loadStatus;
  readonly loadError = this.tasksStore.loadError;
  readonly columns = this.tasksStore.columns;
  readonly hasActiveFilters = this.tasksStore.hasActiveFilters;
  readonly totalVisible = this.tasksStore.totalVisible;
  readonly actionTaskId = this.tasksStore.actionTaskId;
  readonly actionError = this.tasksStore.actionError;

  /** Members keyed by userId for assignee chips. */
  private readonly membersByUserId = signal<Map<string, ProjectMemberResponseDto>>(new Map());

  /** Board (Kanban) or dense list — same data & filters. */
  readonly viewMode = signal<TasksViewMode>('board');

  /** Flat list ordered by status then priority (for list view). */
  readonly listTasks = computed(() => {
    const statusIndex = new Map(TASK_STATUS_ORDER.map((status, index) => [status, index] as const));
    return [...this.tasks()].sort((a, b) => {
      const statusDiff = (statusIndex.get(a.status) ?? 99) - (statusIndex.get(b.status) ?? 99);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    });
  });

  readonly draftQuery = signal('');
  readonly draftAssignedToMe = signal(false);
  readonly draftOverdue = signal(false);

  readonly createOpen = signal(false);

  /** Small screens show one status column at a time. */
  readonly mobileStatus = signal<TaskStatus>('TODO');

  private readonly hlmDialog = inject(HlmDialogService);
  private createRef: BrnDialogRef<boolean> | null = null;

  private readonly loadedForProjectId = signal<string | null>(null);
  private readonly search$ = new Subject<string>();

  constructor() {
    if (!this.currentUser()) {
      this.ngrxStore.dispatch(UserActions.loadMe());
    }

    effect(() => {
      const userId = this.currentUser()?.id ?? null;
      this.tasksStore.setCurrentUserId(userId);
    });

    effect(() => {
      const projectId = this.projectId();
      if (!projectId || this.loadedForProjectId() === projectId) {
        return;
      }
      this.loadedForProjectId.set(projectId);
      this.tasksStore.setProjectId(projectId);
      this.tasksStore.load();
      this.loadMembers(projectId);
    });

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.tasksStore.setFilters({
          query,
          assignedToMe: this.draftAssignedToMe(),
          overdue: this.draftOverdue(),
        });
        this.tasksStore.load();
      });
  }

  /**
   * Board shortcuts (ignored while typing in inputs):
   * n — new task · / — focus search · 1 board · 2 list · Esc — close create
   */
  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const key = event.key;

    if (key === 'Escape') {
      if (this.createOpen()) {
        event.preventDefault();
        this.closeCreate();
        return;
      }
      return;
    }

    if (isEditableTarget(event.target)) {
      return;
    }

    if (key === 'n' || key === 'N') {
      event.preventDefault();
      this.openCreate();
      setTimeout(() => document.getElementById('task-title')?.focus(), 50);
      return;
    }

    if (key === '/') {
      event.preventDefault();
      document.getElementById('board-search')?.focus();
      return;
    }

    if (key === '1') {
      event.preventDefault();
      this.setViewMode('board');
      return;
    }

    if (key === '2') {
      event.preventDefault();
      this.setViewMode('list');
    }
  }

  private loadMembers(projectId: string): void {
    this.membersApi.findAll(projectId, { page: 1, limit: MEMBERS_LIMIT }).subscribe({
      next: (response) => {
        const map = new Map<string, ProjectMemberResponseDto>();
        for (const member of response.data ?? []) {
          map.set(member.userId, member);
        }
        this.membersByUserId.set(map);
      },
      error: () => {
        this.membersByUserId.set(new Map());
      },
    });
  }

  setViewMode(mode: TasksViewMode): void {
    this.viewMode.set(mode);
  }

  load(): void {
    this.tasksStore.load();
  }

  clearFilters(): void {
    this.draftQuery.set('');
    this.draftAssignedToMe.set(false);
    this.draftOverdue.set(false);
    this.tasksStore.clearFilters();
    this.tasksStore.load();
  }

  toggleAssignedToMe(): void {
    const next = !this.draftAssignedToMe();
    this.draftAssignedToMe.set(next);
    this.tasksStore.setFilters({
      query: this.draftQuery(),
      assignedToMe: next,
      overdue: this.draftOverdue(),
    });
    this.tasksStore.load();
  }

  toggleOverdue(): void {
    const next = !this.draftOverdue();
    this.draftOverdue.set(next);
    this.tasksStore.setFilters({
      query: this.draftQuery(),
      assignedToMe: this.draftAssignedToMe(),
      overdue: next,
    });
    this.tasksStore.load();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.draftQuery.set(input.value);
    this.search$.next(input.value);
  }

  openCreate(): void {
    if (this.createRef) {
      return;
    }
    this.createOpen.set(true);

    const data: TaskCreateDialogData = {
      initialStatus: this.mobileStatus(),
      memberOptions: this.memberOptions,
      create: (dto, callbacks, status) => this.tasksStore.create(dto, callbacks, status),
    };

    const ref = this.hlmDialog.open<boolean, TaskCreateDialogData>(TaskCreateDialog, {
      contentClass: 'sm:max-w-lg',
      showCloseButton: true,
      closeLabel: this.messages.create.cancel,
      context: data,
    });
    this.createRef = ref;
    ref.closed$.subscribe(() => {
      this.createRef = null;
      this.createOpen.set(false);
    });
  }

  closeCreate(): void {
    this.createRef?.close();
  }

  dueLabel(task: TaskResponseDto): string | null {
    if (!task.dueDate) {
      return null;
    }
    const date = new Date(task.dueDate);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  isOverdue(task: TaskResponseDto): boolean {
    if (!task.dueDate || task.status === 'DONE') {
      return false;
    }
    const due = new Date(task.dueDate).getTime();
    return !Number.isNaN(due) && due < Date.now();
  }

  /** Display name for the assignee, or null if unassigned / unknown. */
  assigneeName(task: TaskResponseDto): string | null {
    const id = task.assignedToId;
    if (!id) {
      return null;
    }
    const member = this.membersByUserId().get(id);
    if (!member) {
      return null;
    }
    return member.user?.name?.trim() || member.user?.email || null;
  }

  /** One- or two-letter initials for the assignee avatar chip. */
  assigneeInitials(task: TaskResponseDto): string | null {
    const name = this.assigneeName(task);
    if (!name) {
      return null;
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  statusLabel(status: TaskStatus): string {
    switch (status) {
      case 'TODO':
        return this.messages.status.TODO;
      case 'IN_PROGRESS':
        return this.messages.status.IN_PROGRESS;
      case 'IN_REVIEW':
        return this.messages.status.IN_REVIEW;
      case 'DONE':
        return this.messages.status.DONE;
      default:
        return String(status);
    }
  }

  priorityLabel(priority: TaskPriority): string {
    switch (priority) {
      case 'LOW':
        return this.messages.priority.LOW;
      case 'MEDIUM':
        return this.messages.priority.MEDIUM;
      case 'HIGH':
        return this.messages.priority.HIGH;
      case 'URGENT':
        return this.messages.priority.URGENT;
      default:
        return String(priority);
    }
  }

  /** Semantic priority chips from design tokens (Phase A UX). */
  priorityChipClass(priority: TaskPriority): string {
    return `sl-priority-chip sl-priority-chip-${priority}`;
  }

  readonly memberOptions = computed(() =>
    [...this.membersByUserId().values()].map((member) => ({
      id: member.userId,
      label: member.user?.name ?? member.user?.email ?? member.userId,
    }))
  );

  onStatusChange(task: TaskResponseDto, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const status = select.value as TaskStatus;
    if (status === task.status) {
      return;
    }

    this.tasksStore.updateStatus(task, status, {
      onError: () => {
        select.value = task.status;
      },
    });
  }

  async onDelete(task: TaskResponseDto): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: this.messages.confirm.deleteTitle,
      description: this.messages.confirm.deleteBody,
      confirmLabel: UI_MESSAGES.dialog.delete,
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    this.tasksStore.softDelete(task, {
      onSuccess: () => appToast.success(this.messages.actions.delete),
      onError: (message) => appToast.error(message),
    });
  }
}
