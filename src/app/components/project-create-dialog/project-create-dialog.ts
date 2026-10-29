import { Component, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogDescription, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { ProjectResponseDto, ProjectsApiService } from '../../core/projects/projects-api.service';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { firstFieldErrorMessage } from '../../utils';
import { getApiErrorMessage } from '../../core/api/api-error';
import { z } from 'zod';
import { PROJECTS_MESSAGES } from '../../constants';

const messages = PROJECTS_MESSAGES.validation;

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: messages.nameRequired })
    .min(2, { message: messages.nameMinLength }),
  description: z.string(),
});

export type CreateProjectModel = z.infer<typeof createProjectSchema>;

@Component({
  imports: [
    HlmButton,
    HlmDialogDescription,
    HlmDialogTitle,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
    HlmInput,
    HlmTextarea,
    FormField,
  ],
  selector: 'sl-project-create-dialog',
  styleUrl: './project-create-dialog.scss',
  templateUrl: './project-create-dialog.html',
})
export class ProjectCreateDialog {
  private readonly dialogRef = inject<BrnDialogRef<ProjectResponseDto | undefined>>(BrnDialogRef);
  private readonly projectsApi = inject(ProjectsApiService);

  readonly messages = PROJECTS_MESSAGES;

  readonly showErrors = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  private readonly model = signal<CreateProjectModel>({ name: '', description: '' });

  readonly createForm = form(this.model, (schemaPath) => {
    validateStandardSchema(schemaPath, createProjectSchema);
  });

  fieldError(field: 'name' | 'description'): string | null {
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
    const { name, description } = this.model();
    const dto = {
      name,
      ...(description.trim().length > 0 ? { description: description.trim() } : {}),
    };

    this.projectsApi.create(dto).subscribe({
      next: (project) => {
        this.submitting.set(false);
        this.dialogRef.close(project);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.serverError.set(getApiErrorMessage(error));
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
