import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';

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
  TasksApiService,
} from '../../core/tasks/tasks-api.service';
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
    TaskCommentsPanel,
    TaskAttachmentsPanel,
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

  readonly messages = TASKS_MESSAGES;
  readonly commentsMessages = COMMENTS_MESSAGES;
  readonly attachmentsMessages = ATTACHMENTS_MESSAGES;
  readonly statusOrder = TASK_STATUS_ORDER;

  readonly tasks = signal<TaskResponseDto[]>([]);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

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

  private readonly loadedForProjectId = signal<string | null>(null);

  constructor() {
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

    this.tasksApi.findAll(projectId, { page: 1, limit: DEFAULT_LIMIT }).subscribe({
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
}
