import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  input,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports, HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import {
  type ProjectMemberResponseDto,
  ProjectMembersApiService,
} from '../../core/projects/project-members-api.service';
import { ConfirmDialogService } from '../../core/ui/confirm-dialog.service';
import { appToast } from '../../core/ui/toast';
import { UI_MESSAGES } from '../../core/ui/ui.messages';
import {
  type TaskPriority,
  type TaskResponseDto,
  type TaskStatus,
} from '../../core/tasks/tasks-api.service';
import { UserActions } from '../../core/users/user.actions';
import { selectCurrentUser } from '../../core/users/user.reducer';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { ProjectTasksStore } from './project-tasks.store';
import { TASK_STATUS_ORDER, TASKS_MESSAGES } from './tasks.messages';
import { createTaskSchema, type CreateTaskModel } from './tasks.schemas';

export type TasksViewMode = 'board' | 'list';

const PRIORITY_RANK: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const MEMBERS_LIMIT = 100 as const;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return target.isContentEditable;
}

@Component({
  selector: 'sl-project-tasks-board-panel',
  providers: [ProjectTasksStore],
  imports: [
    FormField,
    RouterLink,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    ...HlmButtonImports,
    ...HlmDialogImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmSelectImports,
    ...HlmSkeletonImports,
    ...HlmTextareaImports,
  ],
  templateUrl: './project-tasks-board.panel.html',
})
export class ProjectTasksBoardPanel {
  readonly projectId = input.required<string>();

  private readonly tasksStore = inject(ProjectTasksStore);
  private readonly membersApi = inject(ProjectMembersApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly ngrxStore = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  readonly messages = TASKS_MESSAGES;
  readonly statusOrder = TASK_STATUS_ORDER;
  readonly priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

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

  private readonly dialog = inject(HlmDialogService);
  private readonly createTpl = viewChild.required<TemplateRef<unknown>>('createDialog');
  private createRef: BrnDialogRef | null = null;
  readonly createShowErrors = signal(false);
  readonly createSubmitting = signal(false);
  readonly createServerError = signal<string | null>(null);

  readonly quickAddStatus = signal<TaskStatus | null>(null);
  readonly quickAddTitle = signal('');
  readonly quickAddSubmitting = signal(false);

  private readonly createModel = signal<CreateTaskModel>(emptyCreateModel());

  readonly createForm = form(this.createModel, (schemaPath) => {
    validateStandardSchema(schemaPath, createTaskSchema);
  });

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
   * n — new task · / — focus search · 1 board · 2 list · Esc — close create/quick-add
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
      if (this.quickAddStatus()) {
        event.preventDefault();
        this.closeQuickAdd();
      }
      return;
    }

    if (isEditableTarget(event.target)) {
      return;
    }

    if (key === 'n' || key === 'N') {
      event.preventDefault();
      this.openCreate();
      queueMicrotask(() => {
        document.getElementById('task-title')?.focus();
      });
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
    this.createOpen.set(true);
    this.createServerError.set(null);
    this.createModel.update((current) => ({ ...current, status: this.mobileStatus() }));

    if (!this.createRef) {
      const ref = this.dialog.open(this.createTpl(), {
        contentClass: 'sm:max-w-lg',
        showCloseButton: true,
        closeLabel: this.messages.create.cancel,
      });
      this.createRef = ref;
      ref.closed$.subscribe(() => {
        this.createRef = null;
        if (this.createOpen()) {
          this.closeCreate();
        }
      });
    }
  }

  closeCreate(): void {
    this.createOpen.set(false);
    this.createRef?.close();
    this.createShowErrors.set(false);
    this.createServerError.set(null);
    this.createModel.set(emptyCreateModel());
  }

  openQuickAdd(status: TaskStatus): void {
    this.quickAddStatus.set(status);
    this.quickAddTitle.set('');
  }

  closeQuickAdd(): void {
    this.quickAddStatus.set(null);
    this.quickAddTitle.set('');
    this.quickAddSubmitting.set(false);
  }

  onQuickAddTitleInput(event: Event): void {
    this.quickAddTitle.set((event.target as HTMLInputElement).value);
  }

  submitQuickAdd(status: TaskStatus, event?: Event): void {
    event?.preventDefault();
    const title = this.quickAddTitle().trim();
    if (title.length < 2 || this.quickAddSubmitting()) {
      return;
    }

    this.quickAddSubmitting.set(true);
    this.tasksStore.createInColumn(title, status, {
      onSuccess: () => {
        this.quickAddSubmitting.set(false);
        this.closeQuickAdd();
        appToast.success(this.messages.create.success);
      },
      onError: (message) => {
        this.quickAddSubmitting.set(false);
        appToast.error(message);
      },
    });
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

  readonly priorityToString = (value: unknown): string =>
    this.messages.priority[value as keyof typeof this.messages.priority] ?? String(value ?? '');

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

  createPriority(): TaskPriority {
    return this.createModel().priority;
  }

  readonly statusToString = (value: unknown): string =>
    this.messages.status[value as TaskStatus] ?? String(value ?? '');

  readonly assigneeToString = (value: unknown): string => {
    const id = String(value ?? '');
    if (!id) {
      return this.messages.detail.unassigned;
    }
    const member = this.membersByUserId().get(id);
    return member ? (member.user?.name ?? member.user?.email ?? id) : id;
  };

  readonly memberOptions = computed(() =>
    [...this.membersByUserId().values()].map((member) => ({
      id: member.userId,
      label: member.user?.name ?? member.user?.email ?? member.userId,
    })),
  );

  readonly createStatus = computed(() => this.createModel().status);
  readonly createAssignee = computed(() => this.createModel().assignedToId);

  setCreateStatus(value: unknown): void {
    if (typeof value === 'string' && TASK_STATUS_ORDER.includes(value as TaskStatus)) {
      this.createModel.update((current) => ({ ...current, status: value as TaskStatus }));
    }
  }

  setCreateAssignee(value: unknown): void {
    this.createModel.update((current) => ({ ...current, assignedToId: String(value ?? '') }));
  }

  setCreatePriority(value: unknown): void {
    if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'URGENT') {
      this.createModel.update((current) => ({ ...current, priority: value }));
    }
  }

  createFieldError(field: 'title' | 'description' | 'priority'): string | null {
    const state = this.createForm[field]();
    if (!this.createShowErrors() && !state.touched()) {
      return null;
    }
    return firstFieldErrorMessage(state.errors());
  }

  onCreateSubmit(event: Event): void {
    event.preventDefault();
    this.createServerError.set(null);
    this.createShowErrors.set(true);

    if (this.createForm().invalid() || this.createSubmitting()) {
      return;
    }

    this.createSubmitting.set(true);
    const { title, description, priority, status, dueDate, assignedToId } = this.createModel();
    const dto = {
      title,
      priority,
      ...(description.trim().length > 0 ? { description: description.trim() } : {}),
      ...(dueDate.trim().length > 0 ? { dueDate: `${dueDate.trim()}T17:00:00Z` } : {}),
      ...(assignedToId ? { assignedToId } : {}),
    };

    this.tasksStore.create(
      dto,
      {
      onSuccess: () => {
        this.createSubmitting.set(false);
        appToast.success(this.messages.create.success);
        this.createModel.set(emptyCreateModel());
        this.createShowErrors.set(false);
        this.closeCreate();
      },
      onError: (message) => {
        this.createSubmitting.set(false);
        this.createServerError.set(message);
      },
      },
      status,
    );
  }

  onTaskDrop(event: CdkDragDrop<TaskStatus, TaskStatus, TaskResponseDto>): void {
    if (event.previousContainer === event.container) {
      return;
    }

    const task = event.item.data;
    const nextStatus = event.container.data;
    if (!task || task.status === nextStatus) {
      return;
    }

    this.tasksStore.updateStatus(task, nextStatus, {
      onError: (message) => appToast.error(message),
    });
  }

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
    const confirmed = await this.confirmDialog.confirm({
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

function emptyCreateModel(): CreateTaskModel {
  return {
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    assignedToId: '',
  };
}
