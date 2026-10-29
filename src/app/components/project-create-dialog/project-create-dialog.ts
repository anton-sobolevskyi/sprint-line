import { Component, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogDescription, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { firstFieldErrorMessage, getApiErrorMessage } from '@utils';
import { CreateProjectModel, createProjectSchema } from './project-create-dialog.schema';
import { Projects } from '@core/services/projects';
import { ProjectResponseDto } from '@types';
import { PROJECTS_MESSAGES } from '@constants/messages';

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
  private readonly projectsApi = inject(Projects);

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
