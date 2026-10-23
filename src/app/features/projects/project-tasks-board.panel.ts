import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { getApiErrorMessage } from '../../core/api/api-error';
import { ConfirmDialogService } from '../../core/ui/confirm-dialog.service';
import { appToast } from '../../core/ui/toast';
import { UI_MESSAGES } from '../../core/ui/ui.messages';
import {
  type TaskPriority,
  type TaskResponseDto,
  type TaskStatus,
  type TasksListQuery,
  TasksApiService,
} from '../../core/tasks/tasks-api.service';
import { UserActions } from '../../core/users/user.actions';
import { selectCurrentUser } from '../../core/users/user.reducer';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { ATTACHMENTS_MESSAGES } from './attachments.messages';
import { COMMENTS_MESSAGES } from './comments.messages';
import { TaskAttachmentsPanel } from './task-attachments.panel';
import { TaskCommentsPanel } from './task-comments.panel';
import { TASK_STATUS_ORDER, TASKS_MESSAGES } from './tasks.messages';
import { createTaskSchema, type CreateTaskModel } from './tasks.schemas';

const DEFAULT_LIMIT = 100 as const;

@Component({
  selector: 'sl-project-tasks-board-panel',
  imports: [
    FormField,
    RouterLink,
    TaskCommentsPanel,
    TaskAttachmentsPanel,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmTextareaImports,
  ],
  templateUrl: './project-tasks-board.panel.html',
})
export class ProjectTasksBoardPanel {
  readonly projectId = input.required<string>();

  private readonly tasksApi = inject(TasksApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly store = inject(Store);

  readonly messages = TASKS_MESSAGES;
  readonly commentsMessages = COMMENTS_MESSAGES;
  readonly attachmentsMessages = ATTACHMENTS_MESSAGES;
  readonly statusOrder = TASK_STATUS_ORDER;

  readonly currentUser = this.store.selectSignal(selectCurrentUser);

  readonly tasks = signal<TaskResponseDto[]>([]);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  /** Draft filters (UI). Applied on Apply. */
  readonly draftQuery = signal('');
  readonly draftAssignedToMe = signal(false);
  readonly draftOverdue = signal(false);

  /** Active filters used for the last successful load. */
  readonly activeQuery = signal('');
  readonly activeAssignedToMe = signal(false);
  readonly activeOverdue = signal(false);

  readonly createShowErrors = signal(false);
  readonly createSubmitting = signal(false);
  readonly createServerError = signal<string | null>(null);
  readonly createSuccess = signal<string | null>(null);

  readonly actionTaskId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly expandedCommentsTaskId = signal<string | null>(null);
  readonly expandedFilesTaskId = signal<string | null>(null);

  private readonly createModel = signal<CreateTaskModel>({
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  readonly createForm = form(this.createModel, (schemaPath) => {
    validateStandardSchema(schemaPath, createTaskSchema);
  });

  readonly columns = computed(() => {
    const items = this.tasks();
    return TASK_STATUS_ORDER.map((status) => ({
      status,
      label: this.messages.status[status],
      tasks: items.filter((task) => task.status === status),
    }));
  });

  readonly hasActiveFilters = computed(
    () =>
      this.activeQuery().trim().length > 0 ||
      this.activeAssignedToMe() ||
      this.activeOverdue(),
  );

  readonly totalVisible = computed(() => this.tasks().length);

  private readonly loadedForProjectId = signal<string | null>(null);

  constructor() {
    if (!this.currentUser()) {
      this.store.dispatch(UserActions.loadMe());
    }

    effect(() => {
      const projectId = this.projectId();
      if (!projectId || this.loadedForProjectId() === projectId) {
        return;
      }
      this.loadedForProjectId.set(projectId);
      this.load();
    });
  }

  load(): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    this.loadStatus.set('loading');
    this.loadError.set(null);

    const query = this.buildListQuery();

    this.tasksApi.findAll(projectId, query).subscribe({
      next: (response) => {
        this.tasks.set(response.data);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });
  }

  applyFilters(event?: Event): void {
    event?.preventDefault();
    this.activeQuery.set(this.draftQuery().trim());
    this.activeAssignedToMe.set(this.draftAssignedToMe());
    this.activeOverdue.set(this.draftOverdue());
    this.load();
  }

  clearFilters(): void {
    this.draftQuery.set('');
    this.draftAssignedToMe.set(false);
    this.draftOverdue.set(false);
    this.activeQuery.set('');
    this.activeAssignedToMe.set(false);
    this.activeOverdue.set(false);
    this.load();
  }

  onAssignedToMeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.draftAssignedToMe.set(input.checked);
  }

  onOverdueChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.draftOverdue.set(input.checked);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.draftQuery.set(input.value);
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

  priorityLabel(priority: TaskPriority): string {
    return this.messages.priority[priority];
  }

  isCommentsOpen(taskId: string): boolean {
    return this.expandedCommentsTaskId() === taskId;
  }

  isFilesOpen(taskId: string): boolean {
    return this.expandedFilesTaskId() === taskId;
  }

  toggleComments(taskId: string): void {
    this.expandedCommentsTaskId.update((current) =>
      current === taskId ? null : taskId,
    );
  }

  toggleFiles(taskId: string): void {
    this.expandedFilesTaskId.update((current) =>
      current === taskId ? null : taskId,
    );
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
    this.createSuccess.set(null);
    this.createShowErrors.set(true);

    if (this.createForm().invalid() || this.createSubmitting()) {
      return;
    }

    this.createSubmitting.set(true);
    const { title, description, priority } = this.createModel();
    const dto = {
      title,
      priority,
      ...(description.trim().length > 0 ? { description: description.trim() } : {}),
    };

    this.tasksApi.create(this.projectId(), dto).subscribe({
      next: () => {
        this.createSubmitting.set(false);
        this.createSuccess.set(this.messages.create.success);
        appToast.success(this.messages.create.success);
        this.createModel.set({ title: '', description: '', priority: 'MEDIUM' });
        this.createShowErrors.set(false);
        this.load();
      },
      error: (error: unknown) => {
        this.createSubmitting.set(false);
        this.createServerError.set(getApiErrorMessage(error));
      },
    });
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

    const previousStatus = task.status;
    this.actionError.set(null);
    this.actionTaskId.set(task.id);

    this.tasks.update((list) =>
      list.map((item) =>
        item.id === task.id ? { ...item, status: nextStatus } : item,
      ),
    );

    this.tasksApi.update(task.id, { status: nextStatus }).subscribe({
      next: (updated) => {
        this.actionTaskId.set(null);
        this.tasks.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
      },
      error: (error: unknown) => {
        this.actionTaskId.set(null);
        this.tasks.update((list) =>
          list.map((item) =>
            item.id === task.id ? { ...item, status: previousStatus } : item,
          ),
        );
        this.actionError.set(getApiErrorMessage(error));
        appToast.error(getApiErrorMessage(error));
      },
    });
  }

  onStatusChange(task: TaskResponseDto, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const status = select.value as TaskStatus;
    if (status === task.status) {
      return;
    }

    this.actionError.set(null);
    this.actionTaskId.set(task.id);

    this.tasksApi.update(task.id, { status }).subscribe({
      next: (updated) => {
        this.actionTaskId.set(null);
        this.tasks.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
      },
      error: (error: unknown) => {
        this.actionTaskId.set(null);
        select.value = task.status;
        this.actionError.set(getApiErrorMessage(error));
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

    this.actionError.set(null);
    this.actionTaskId.set(task.id);

    this.tasksApi.softDelete(task.id).subscribe({
      next: () => {
        this.actionTaskId.set(null);
        if (this.expandedCommentsTaskId() === task.id) {
          this.expandedCommentsTaskId.set(null);
        }
        if (this.expandedFilesTaskId() === task.id) {
          this.expandedFilesTaskId.set(null);
        }
        this.tasks.update((list) => list.filter((item) => item.id !== task.id));
        appToast.success(this.messages.actions.delete);
      },
      error: (error: unknown) => {
        this.actionTaskId.set(null);
        this.actionError.set(getApiErrorMessage(error));
        appToast.error(getApiErrorMessage(error));
      },
    });
  }

  private buildListQuery(): TasksListQuery {
    const query: TasksListQuery = { page: 1, limit: DEFAULT_LIMIT };

    const q = this.activeQuery().trim();
    if (q.length > 0) {
      query.q = q;
    }

    if (this.activeAssignedToMe()) {
      const userId = this.currentUser()?.id;
      if (userId) {
        query.assignedToId = userId;
      }
    }

    if (this.activeOverdue()) {
      query.dueBefore = new Date().toISOString();
    }

    return query;
  }
}
