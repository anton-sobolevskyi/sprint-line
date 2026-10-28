import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';

import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { getApiErrorMessage } from '../../core/api/api-error';
import {
  type ProjectResponseDto,
  ProjectsApiService,
} from '../../core/projects/projects-api.service';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { PROJECTS_MESSAGES } from './projects.messages';
import { createProjectSchema, type CreateProjectModel } from './projects.schemas';

/**
 * "Create project" dialog content. Opened via `HlmDialogService.open(ProjectCreateDialog)`
 * and closes with the created `ProjectResponseDto` (or nothing when cancelled).
 */
@Component({
  selector: 'sl-project-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    ...HlmButtonImports,
    ...HlmDialogImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmTextareaImports,
  ],
  templateUrl: './project-create.dialog.html',
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
