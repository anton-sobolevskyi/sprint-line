import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';

import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import type { ProjectMemberResponseDto } from '../../core/projects/project-members-api.service';
import type { CreateTaskDto, TaskPriority, TaskStatus } from '../../core/tasks/tasks-api.service';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { TASK_STATUS_ORDER, TASKS_MESSAGES } from './tasks.messages';
import { createTaskSchema, type CreateTaskModel } from './tasks.schemas';

export type CreateTaskDialogContext = {
  initialStatus?: TaskStatus;
  members: ProjectMemberResponseDto[];
  create: (
    dto: CreateTaskDto,
    status: TaskStatus,
    callbacks: { onSuccess: () => void; onError: (message: string) => void },
  ) => void;
};

function emptyCreateModel(status: TaskStatus = 'TODO'): CreateTaskModel {
  return {
    title: '',
    description: '',
    status,
    priority: 'MEDIUM',
    dueDate: '',
    assignedToId: '',
  };
}

@Component({
  selector: 'sl-create-task-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    ...HlmButtonImports,
    ...HlmDialogImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmSelectImports,
    ...HlmTextareaImports,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <h2 hlmDialogTitle>{{ messages.create.title }}</h2>
      <form class="flex flex-col gap-3" (submit)="onSubmit($event)">
        @if (serverError(); as error) {
          <div class="sl-notice sl-notice-danger" role="alert">
            {{ error }}
          </div>
        }

        <div class="grid gap-3">
          <div hlmField>
            <label hlmFieldLabel for="task-title">{{ messages.create.titleLabel }}</label>
            <input
              id="task-title"
              type="text"
              hlmInput
              [formField]="createForm.title"
              [placeholder]="messages.create.titlePlaceholder"
              [attr.aria-invalid]="fieldError('title') ? true : null"
            />
            @if (fieldError('title'); as message) {
              <hlm-field-error forceShow>{{ message }}</hlm-field-error>
            }
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div hlmField>
            <span hlmFieldLabel id="task-status-label">{{ messages.create.statusLabel }}</span>
            <hlm-select
              class="w-full"
              [value]="createStatus()"
              [itemToString]="statusToString"
              (valueChange)="setCreateStatus($event)"
              aria-labelledby="task-status-label"
            >
              <hlm-select-trigger class="w-full"><hlm-select-value /></hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  @for (status of statusOrder; track status) {
                    <hlm-select-item [value]="status">{{ messages.status[status] }}</hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>

          <div hlmField>
            <span hlmFieldLabel id="task-priority-label">{{ messages.create.priorityLabel }}</span>
            <hlm-select
              class="w-full"
              [value]="createPriority()"
              [itemToString]="priorityToString"
              (valueChange)="setCreatePriority($event)"
              aria-labelledby="task-priority-label"
            >
              <hlm-select-trigger class="w-full"><hlm-select-value /></hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  @for (priority of priorityOptions; track priority) {
                    <hlm-select-item [value]="priority">{{
                      messages.priority[priority]
                    }}</hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>

          <div hlmField>
            <label hlmFieldLabel for="task-due">{{ messages.create.dueDateLabel }}</label>
            <input id="task-due" type="date" hlmInput [formField]="createForm.dueDate" />
          </div>

          <div hlmField>
            <span hlmFieldLabel id="task-assignee-label">{{ messages.create.assigneeLabel }}</span>
            <hlm-select
              class="w-full"
              [value]="createAssignee()"
              [itemToString]="assigneeToString"
              (valueChange)="setCreateAssignee($event)"
              aria-labelledby="task-assignee-label"
            >
              <hlm-select-trigger class="w-full"><hlm-select-value /></hlm-select-trigger>
              <hlm-select-content *hlmSelectPortal>
                <hlm-select-group>
                  <hlm-select-item value="">{{ messages.detail.unassigned }}</hlm-select-item>
                  @for (member of memberOptions(); track member.id) {
                    <hlm-select-item [value]="member.id">{{ member.label }}</hlm-select-item>
                  }
                </hlm-select-group>
              </hlm-select-content>
            </hlm-select>
          </div>
        </div>

        <div hlmField>
          <label hlmFieldLabel for="task-description">{{ messages.create.descriptionLabel }}</label>
          <textarea
            id="task-description"
            hlmTextarea
            rows="2"
            [formField]="createForm.description"
            [placeholder]="messages.create.descriptionPlaceholder"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2">
          <button hlmBtn type="button" variant="outline" (click)="close()">
            {{ messages.create.cancel }}
          </button>
          <button hlmBtn type="submit" [disabled]="submitting()">
            {{ submitting() ? messages.create.submitting : messages.create.submit }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CreateTaskDialogComponent {
  private readonly dialogRef = inject<BrnDialogRef<boolean | undefined>>(BrnDialogRef);
  private readonly context = injectBrnDialogContext<CreateTaskDialogContext>();

  readonly messages = TASKS_MESSAGES;
  readonly statusOrder = TASK_STATUS_ORDER;
  readonly priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

  readonly showErrors = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  private readonly model = signal<CreateTaskModel>(
    emptyCreateModel(this.context.initialStatus ?? 'TODO'),
  );

  readonly createForm = form(this.model, (schemaPath) => {
    validateStandardSchema(schemaPath, createTaskSchema);
  });

  readonly memberOptions = computed(() =>
    (this.context.members ?? []).map((member) => ({
      id: member.userId,
      label: member.user?.name ?? member.user?.email ?? member.userId,
    })),
  );

  readonly createStatus = computed(() => this.model().status);
  readonly createAssignee = computed(() => this.model().assignedToId);
  readonly createPriority = computed(() => this.model().priority);

  readonly statusToString = (value: unknown): string =>
    this.messages.status[value as TaskStatus] ?? String(value ?? '');

  readonly priorityToString = (value: unknown): string =>
    this.messages.priority[value as keyof typeof this.messages.priority] ?? String(value ?? '');

  readonly assigneeToString = (value: unknown): string => {
    const id = String(value ?? '');
    if (!id) {
      return this.messages.detail.unassigned;
    }
    const member = (this.context.members ?? []).find((m) => m.userId === id);
    return member ? (member.user?.name ?? member.user?.email ?? id) : id;
  };

  fieldError(field: 'title' | 'description' | 'priority'): string | null {
    const state = this.createForm[field]();
    if (!this.showErrors() && !state.touched()) {
      return null;
    }
    return firstFieldErrorMessage(state.errors());
  }

  setCreateStatus(value: unknown): void {
    if (typeof value === 'string' && TASK_STATUS_ORDER.includes(value as TaskStatus)) {
      this.model.update((current) => ({ ...current, status: value as TaskStatus }));
    }
  }

  setCreateAssignee(value: unknown): void {
    this.model.update((current) => ({ ...current, assignedToId: String(value ?? '') }));
  }

  setCreatePriority(value: unknown): void {
    if (value === 'LOW' || value === 'MEDIUM' || value === 'HIGH' || value === 'URGENT') {
      this.model.update((current) => ({ ...current, priority: value as TaskPriority }));
    }
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

    this.context.create(dto, status, {
      onSuccess: () => {
        this.submitting.set(false);
        this.dialogRef.close(true);
      },
      onError: (message) => {
        this.submitting.set(false);
        this.serverError.set(message);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
