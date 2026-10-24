import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { Component, effect, inject, input, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

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
import { ATTACHMENTS_MESSAGES } from './attachments.messages';
import { COMMENTS_MESSAGES } from './comments.messages';
import { ProjectTasksStore } from './project-tasks.store';
import { TaskAttachmentsPanel } from './task-attachments.panel';
import { TaskCommentsPanel } from './task-comments.panel';
import { TASK_STATUS_ORDER, TASKS_MESSAGES } from './tasks.messages';
import { createTaskSchema, type CreateTaskModel } from './tasks.schemas';

@Component({
  selector: 'sl-project-tasks-board-panel',
  providers: [ProjectTasksStore],
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

  private readonly tasksStore = inject(ProjectTasksStore);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly ngrxStore = inject(Store);

  readonly messages = TASKS_MESSAGES;
  readonly commentsMessages = COMMENTS_MESSAGES;
  readonly attachmentsMessages = ATTACHMENTS_MESSAGES;
  readonly statusOrder = TASK_STATUS_ORDER;

  readonly currentUser = this.ngrxStore.selectSignal(selectCurrentUser);

  /** Expose store signals for the template. */
  readonly tasks = this.tasksStore.tasks;
  readonly loadStatus = this.tasksStore.loadStatus;
  readonly loadError = this.tasksStore.loadError;
  readonly columns = this.tasksStore.columns;
  readonly hasActiveFilters = this.tasksStore.hasActiveFilters;
  readonly totalVisible = this.tasksStore.totalVisible;
  readonly actionTaskId = this.tasksStore.actionTaskId;
  readonly actionError = this.tasksStore.actionError;

  /** Draft filters (UI only until Apply). */
  readonly draftQuery = signal('');
  readonly draftAssignedToMe = signal(false);
  readonly draftOverdue = signal(false);

  readonly createShowErrors = signal(false);
  readonly createSubmitting = signal(false);
  readonly createServerError = signal<string | null>(null);
  readonly createSuccess = signal<string | null>(null);

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

  private readonly loadedForProjectId = signal<string | null>(null);

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
    });
  }

  load(): void {
    this.tasksStore.load();
  }

  applyFilters(event?: Event): void {
    event?.preventDefault();
    this.tasksStore.setFilters({
      query: this.draftQuery(),
      assignedToMe: this.draftAssignedToMe(),
      overdue: this.draftOverdue(),
    });
    this.tasksStore.load();
  }

  clearFilters(): void {
    this.draftQuery.set('');
    this.draftAssignedToMe.set(false);
    this.draftOverdue.set(false);
    this.tasksStore.clearFilters();
    this.tasksStore.load();
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

  /** Tailwind classes for priority chips on the board. */
  priorityChipClass(priority: TaskPriority): string {
    switch (priority) {
      case 'URGENT':
        return 'bg-destructive/15 text-destructive';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-300';
      case 'MEDIUM':
        return 'bg-primary/10 text-primary';
      case 'LOW':
      default:
        return 'bg-muted text-muted-foreground';
    }
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

    this.tasksStore.create(dto, {
      onSuccess: () => {
        this.createSubmitting.set(false);
        this.createSuccess.set(this.messages.create.success);
        appToast.success(this.messages.create.success);
        this.createModel.set({ title: '', description: '', priority: 'MEDIUM' });
        this.createShowErrors.set(false);
      },
      onError: (message) => {
        this.createSubmitting.set(false);
        this.createServerError.set(message);
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
      onSuccess: () => {
        if (this.expandedCommentsTaskId() === task.id) {
          this.expandedCommentsTaskId.set(null);
        }
        if (this.expandedFilesTaskId() === task.id) {
          this.expandedFilesTaskId.set(null);
        }
        appToast.success(this.messages.actions.delete);
      },
      onError: (message) => appToast.error(message),
    });
  }
}
