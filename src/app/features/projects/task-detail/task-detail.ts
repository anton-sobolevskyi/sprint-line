import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  type Signal,
  signal,
  untracked,
} from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectGroup,
  HlmSelectImports,
  HlmSelectItem,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan-ng/helm/select';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTextarea } from '@spartan-ng/helm/textarea';

import { ActivatedRoute, type ParamMap, Router } from '@angular/router';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { appToast } from '@core/ui/toast';
import { firstFieldErrorMessage, getApiErrorMessage, toDateInputValue } from '@utils';
import { UI_MESSAGES } from '@core/ui/ui.messages';
import { toIsoDueDate } from '@utils';
import { TaskComments } from '../task-comments/task-comments';
import { TaskAttachments } from '../task-attachments/task-attachments';
import { UpdateTaskModel, updateTaskSchema } from './task-detail.schema';
import { Tasks } from '@core/services/tasks';
import { ProjectMemberResponseDto, TaskResponseDto, TaskStatus, TaskPriority } from '@types';
import { ProjectMembers } from '@core/services/project-members';
import { TASKS_MESSAGES } from '@constants/messages';
import { MEMBERS_LIMIT, PRIORITY_OPTIONS, TASK_STATUS_ORDER } from '@constants/config';
import { Dialog } from '@core/services/dialog';

@Component({
  imports: [
    HlmButton,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
    HlmInput,
    HlmSelect,
    HlmSelectContent,
    HlmSelectGroup,
    HlmSelectItem,
    HlmSelectTrigger,
    HlmSelectValue,
    HlmSkeleton,
    HlmTextarea,
    TaskAttachments,
    TaskComments,
    FormField,
    HlmSelectImports,
  ],
  selector: 'sl-task-detail',
  styleUrl: './task-detail.scss',
  templateUrl: './task-detail.html',
})
export class TaskDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tasksApi = inject(Tasks);
  private readonly membersApi = inject(ProjectMembers);
  private readonly dialog = inject(Dialog);

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

  /** Reactive route state: the drawer is reused when switching between tasks. */
  private readonly ownParams = toSignal(this.route.paramMap, { requireSync: true });
  private readonly parentParams: Signal<ParamMap | null> = this.route.parent
    ? toSignal(this.route.parent.paramMap, { requireSync: true })
    : signal(null);

  /** Incremented per request so a slow response for a previous task is ignored. */
  private loadSeq = 0;

  constructor() {
    effect(() => {
      const { projectId, taskId } = this.resolveIds();
      this.projectId.set(projectId);
      this.taskId.set(taskId);
      if (!projectId || !taskId) {
        return;
      }
      untracked(() => {
        this.task.set(null);
        this.syncedTaskId.set(null);
        this.load(projectId, taskId);
      });
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
    const own = this.ownParams();
    const taskId = own.get('taskId');
    const projectId = own.get('projectId') ?? this.parentParams()?.get('id') ?? null;
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
    const seq = ++this.loadSeq;
    this.loadStatus.set('loading');
    this.loadError.set(null);

    this.tasksApi.findOne(taskId).subscribe({
      next: (task) => {
        if (seq !== this.loadSeq) {
          return;
        }
        this.task.set(task);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        if (seq !== this.loadSeq) {
          return;
        }
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });

    this.membersApi.findAll(projectId, { page: 1, limit: MEMBERS_LIMIT }).subscribe({
      next: (response) => {
        if (seq === this.loadSeq) {
          this.members.set(response.data);
        }
      },
      error: () => {
        if (seq === this.loadSeq) {
          this.members.set([]);
        }
      },
    });
  }

  reload(): void {
    const projectId = this.projectId();
    const taskId = this.taskId();
    if (projectId && taskId) {
      this.load(projectId, taskId);
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

    const confirmed = await this.dialog.confirm({
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
