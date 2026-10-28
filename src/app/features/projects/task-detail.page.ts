import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { getApiErrorMessage } from '../../core/api/api-error';
import { ConfirmDialogService } from '../../core/ui/confirm-dialog.service';
import { appToast } from '../../core/ui/toast';
import { UI_MESSAGES } from '../../core/ui/ui.messages';
import {
  type ProjectMemberResponseDto,
  ProjectMembersApiService,
} from '../../core/projects/project-members-api.service';
import {
  type TaskPriority,
  type TaskResponseDto,
  type TaskStatus,
  TasksApiService,
} from '../../core/tasks/tasks-api.service';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { TaskAttachmentsPanel } from './task-attachments.panel';
import { TaskCommentsPanel } from './task-comments.panel';
import { TASK_STATUS_ORDER, TASKS_MESSAGES } from './tasks.messages';
import { type UpdateTaskModel, updateTaskSchema } from './tasks.schemas';

const MEMBERS_LIMIT = 100 as const;

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

@Component({
  selector: 'sl-task-detail-page',
  imports: [
    FormField,
    TaskCommentsPanel,
    TaskAttachmentsPanel,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmSelectImports,
    ...HlmSkeletonImports,
    ...HlmTextareaImports,
  ],
  templateUrl: './task-detail.page.html',
  host: {
    class: 'contents',
  },
})
export class TaskDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tasksApi = inject(TasksApiService);
  private readonly membersApi = inject(ProjectMembersApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly messages = TASKS_MESSAGES;
  readonly statusOrder = TASK_STATUS_ORDER;
  readonly priorityOptions = PRIORITY_OPTIONS;

  readonly projectId = signal<string | null>(null);
  readonly taskId = signal<string | null>(null);

  readonly task = signal<TaskResponseDto | null>(null);
  readonly members = signal<ProjectMemberResponseDto[]>([]);

  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  readonly showErrors = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly deleteSubmitting = signal(false);

  private readonly model = signal<UpdateTaskModel>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    assignedToId: '',
  });

  readonly editForm = form(this.model, (schemaPath) => {
    validateStandardSchema(schemaPath, updateTaskSchema);
  });

  private readonly syncedTaskId = signal<string | null>(null);

  readonly saveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');

  /** True when the form differs from the last task returned by the API. */
  readonly isDirty = computed(() => {
    const task = this.task();
    const values = this.model();
    if (!task || this.syncedTaskId() !== task.id) {
      return false;
    }
    return (
      values.title !== task.title ||
      values.description.trim() !== (task.description ?? '').trim() ||
      values.status !== task.status ||
      values.priority !== task.priority ||
      values.dueDate !== toDateInputValue(task.dueDate) ||
      values.assignedToId !== (task.assignedToId ?? '')
    );
  });

  readonly saveLabel = computed(() => {
    const labels = this.messages.detail.autosave;
    if (this.saveState() === 'saving' || this.submitting()) {
      return labels.saving;
    }
    if (this.saveState() === 'error') {
      return labels.error;
    }
    if (this.isDirty()) {
      return this.editForm().invalid() ? labels.invalid : labels.dirty;
    }
    return labels.saved;
  });
  private readonly loadedKey = signal<string | null>(null);

  constructor() {
    effect(() => {
      const { projectId, taskId } = this.resolveIds();
      this.projectId.set(projectId);
      this.taskId.set(taskId);
      const key = projectId && taskId ? `${projectId}:${taskId}` : null;
      if (!key || this.loadedKey() === key) {
        return;
      }
      this.loadedKey.set(key);
      this.load(projectId!, taskId!);
    });

    // Autosave: debounce edits, skip while the form is invalid.
    effect((onCleanup) => {
      if (!this.isDirty() || this.editForm().invalid() || this.saveState() === 'error') {
        return;
      }
      this.model();
      const timer = setTimeout(() => void this.persist(), 700);
      onCleanup(() => clearTimeout(timer));
    });

    effect(() => {
      const task = this.task();
      if (!task || this.syncedTaskId() === task.id) {
        return;
      }
      this.syncedTaskId.set(task.id);
      this.model.set({
        title: task.title,
        description: task.description ?? '',
        status: task.status,
        priority: task.priority,
        dueDate: toDateInputValue(task.dueDate),
        assignedToId: task.assignedToId ?? '',
      });
    });
  }

  /** Nested: parent has :id, child has :taskId. Flat fallback: :projectId. */
  private resolveIds(): { projectId: string | null; taskId: string | null } {
    const taskId = this.route.snapshot.paramMap.get('taskId');
    const projectId =
      this.route.snapshot.paramMap.get('projectId') ??
      this.route.parent?.snapshot.paramMap.get('id') ??
      null;
    return { projectId, taskId };
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  /** Close drawer and return to the project board (parent stays mounted). */
  async close(): Promise<void> {
    if (this.isDirty() && !this.editForm().invalid() && !this.submitting()) {
      await this.persist();
    }
    const projectId = this.projectId();
    if (projectId) {
      void this.router.navigate(['/projects', projectId]);
      return;
    }
    void this.router.navigateByUrl('/projects');
  }

  load(projectId: string, taskId: string): void {
    this.loadStatus.set('loading');
    this.loadError.set(null);

    this.tasksApi.findOne(taskId).subscribe({
      next: (task) => {
        this.task.set(task);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });

    this.membersApi.findAll(projectId, { page: 1, limit: MEMBERS_LIMIT }).subscribe({
      next: (response) => {
        this.members.set(response.data);
      },
      error: () => {
        this.members.set([]);
      },
    });
  }

  reload(): void {
    const projectId = this.projectId();
    const taskId = this.taskId();
    if (projectId && taskId) {
      this.loadedKey.set(null);
      this.load(projectId, taskId);
      this.loadedKey.set(`${projectId}:${taskId}`);
    }
  }

  /** Select trigger labels. Without these the trigger shows the raw value (IN_PROGRESS, user id). */
  readonly statusToString = (value: unknown): string =>
    this.messages.status[value as keyof typeof this.messages.status] ?? String(value ?? '');

  readonly priorityToString = (value: unknown): string =>
    this.messages.priority[value as keyof typeof this.messages.priority] ?? String(value ?? '');

  readonly assigneeToString = (value: unknown): string => {
    const id = String(value ?? '');
    if (!id) {
      return this.messages.detail.unassigned;
    }
    const member = this.members().find((m) => m.userId === id);
    return member ? this.memberLabel(member) : id;
  };

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      appToast.success(this.messages.detail.linkCopied);
    } catch {
      appToast.error(this.messages.detail.copyLink);
    }
  }

  memberLabel(member: ProjectMemberResponseDto): string {
    return member.user?.name ?? member.user?.email ?? member.userId;
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

  editStatus(): TaskStatus {
    return this.model().status;
  }

  editPriority(): TaskPriority {
    return this.model().priority;
  }

  editAssigneeId(): string {
    return this.model().assignedToId;
  }

  /** Any edit clears a previous save error so autosave can retry. */
  private touchEdit(): void {
    if (this.saveState() === 'error') {
      this.saveState.set('idle');
    }
  }

  setEditStatus(value: unknown): void {
    this.touchEdit();
    if (value === 'TODO' || value === 'IN_PROGRESS' || value === 'IN_REVIEW' || value === 'DONE') {
      this.model.update((current) => ({ ...current, status: value }));
    }
  }

  setEditPriority(value: unknown): void {
    this.touchEdit();
    if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'URGENT') {
      this.model.update((current) => ({ ...current, priority: value }));
    }
  }

  setEditAssignee(value: unknown): void {
    this.touchEdit();
    const id = value == null ? '' : String(value);
    this.model.update((current) => ({ ...current, assignedToId: id }));
  }

  fieldError(
    field: 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assignedToId'
  ): string | null {
    const state = this.editForm[field]();
    if (!this.showErrors() && !state.touched()) {
      return null;
    }
    return firstFieldErrorMessage(state.errors());
  }

  /** Enter in the title field flushes immediately. */
  onSave(event: Event): void {
    event.preventDefault();
    this.showErrors.set(true);
    if (!this.editForm().invalid()) {
      void this.persist();
    }
  }

  /** Sends the current form values. The form is not reset afterwards, so typing is never overwritten. */
  private persist(): Promise<void> {
    const task = this.task();
    if (!task || this.submitting() || !this.isDirty() || this.editForm().invalid()) {
      return Promise.resolve();
    }

    this.serverError.set(null);
    this.submitting.set(true);
    this.saveState.set('saving');
    const values = this.model();

    const dto = {
      title: values.title,
      description: values.description.trim(),
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate.trim().length > 0 ? toIsoDueDate(values.dueDate) : null,
      assignedToId: values.assignedToId.trim().length > 0 ? values.assignedToId : null,
    };

    return new Promise<void>((resolve) => {
      this.tasksApi.update(task.id, dto).subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.saveState.set('saved');
          this.task.set(updated);
          resolve();
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.saveState.set('error');
          this.serverError.set(getApiErrorMessage(error));
          appToast.error(getApiErrorMessage(error));
          resolve();
        },
      });
    });
  }

  async onDelete(): Promise<void> {
    const task = this.task();
    const projectId = this.projectId();
    if (!task || !projectId || this.deleteSubmitting()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.messages.confirm.deleteTitle,
      description: this.messages.confirm.deleteBody,
      confirmLabel: UI_MESSAGES.dialog.delete,
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    this.deleteSubmitting.set(true);

    this.tasksApi.softDelete(task.id).subscribe({
      next: () => {
        this.deleteSubmitting.set(false);
        appToast.success(this.messages.actions.delete);
        void this.router.navigate(['/projects', projectId]);
      },
      error: (error: unknown) => {
        this.deleteSubmitting.set(false);
        appToast.error(getApiErrorMessage(error));
      },
    });
  }
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toIsoDueDate(dateInput: string): string {
  return `${dateInput}T17:00:00Z`;
}
