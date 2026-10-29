import { Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogTitle } from '@spartan-ng/helm/dialog';
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
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { firstFieldErrorMessage } from '../../utils';
import { appToast } from '../../core/ui/toast';
import { TaskCreateDialogData } from './task-create-dialog.types';
import { CreateTaskModel, createTaskSchema } from './task-create-dialog.schema';
import { CreateTaskDto, TaskStatus } from '@types';
import { TASKS_MESSAGES } from '@constants/messages';
import { TASK_STATUS_ORDER } from '@constants/config';

@Component({
  imports: [
    HlmButton,
    HlmDialogTitle,
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
    HlmTextarea,
    FormField,
    HlmSelectImports,
  ],
  selector: 'sl-task-create-dialog',
  styleUrl: './task-create-dialog.scss',
  templateUrl: './task-create-dialog.html',
})
export class TaskCreateDialog {
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  private readonly data = injectBrnDialogContext<TaskCreateDialogData>();

  readonly messages = TASKS_MESSAGES;
  readonly statusOrder = TASK_STATUS_ORDER;
  readonly priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
  readonly memberOptions = this.data.memberOptions;

  readonly showErrors = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  private readonly model = signal<CreateTaskModel>(this.emptyModel(this.data.initialStatus));

  readonly createForm = form(this.model, (schemaPath) => {
    validateStandardSchema(schemaPath, createTaskSchema);
  });

  readonly status = computed(() => this.model().status);
  readonly priority = computed(() => this.model().priority);
  readonly assignee = computed(() => this.model().assignedToId);

  readonly statusToString = (value: unknown): string =>
    this.messages.status[value as TaskStatus] ?? String(value ?? '');

  readonly priorityToString = (value: unknown): string =>
    this.messages.priority[value as keyof typeof this.messages.priority] ?? String(value ?? '');

  readonly assigneeToString = (value: unknown): string => {
    const id = String(value ?? '');
    if (!id) {
      return this.messages.detail.unassigned;
    }
    return this.memberOptions().find((member) => member.id === id)?.label ?? id;
  };

  setStatus(value: unknown): void {
    if (typeof value === 'string' && TASK_STATUS_ORDER.includes(value as TaskStatus)) {
      this.model.update((current) => ({ ...current, status: value as TaskStatus }));
    }
  }

  setPriority(value: unknown): void {
    if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'URGENT') {
      this.model.update((current) => ({ ...current, priority: value }));
    }
  }

  setAssignee(value: unknown): void {
    this.model.update((current) => ({ ...current, assignedToId: String(value ?? '') }));
  }

  fieldError(field: 'title' | 'description' | 'priority'): string | null {
    const state = this.createForm[field]();
    if (!this.showErrors() && !state.touched()) {
      return null;
    }
    return firstFieldErrorMessage(state.errors());
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.serverError.set(null);
    this.showErrors.set(true);

    if (this.createForm().invalid() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    const { title, description, priority, status, dueDate, assignedToId } = this.model();
    const dto: CreateTaskDto = {
      title,
      priority,
      ...(description.trim().length > 0 ? { description: description.trim() } : {}),
      ...(dueDate.trim().length > 0 ? { dueDate: `${dueDate.trim()}T17:00:00Z` } : {}),
      ...(assignedToId ? { assignedToId } : {}),
    };

    this.data.create(
      dto,
      {
        onSuccess: () => {
          this.submitting.set(false);
          appToast.success(this.messages.create.success);
          this.dialogRef.close(true);
        },
        onPartialSuccess: (message) => {
          // The task exists but could not be moved to the chosen column.
          this.submitting.set(false);
          appToast.info(this.messages.create.partialSuccess, message);
          this.dialogRef.close(true);
        },
        onError: (message) => {
          this.submitting.set(false);
          this.serverError.set(message);
        },
      },
      status
    );
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  private emptyModel(status: TaskStatus): CreateTaskModel {
    return {
      title: '',
      description: '',
      status,
      priority: 'MEDIUM',
      dueDate: '',
      assignedToId: '',
    };
  }
}
