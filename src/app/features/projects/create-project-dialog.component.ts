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

@Component({
  selector: 'sl-create-project-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    ...HlmButtonImports,
    ...HlmDialogImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmTextareaImports,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <h2 hlmDialogTitle>{{ messages.create.title }}</h2>
        <p hlmDialogDescription>{{ messages.create.description }}</p>
      </div>
      <form class="flex flex-col gap-3" (submit)="onSubmit($event)">
        @if (serverError(); as error) {
          <div class="sl-notice sl-notice-danger" role="alert">
            {{ error }}
          </div>
        }

        <div hlmField>
          <label hlmFieldLabel for="project-name">{{ messages.create.nameLabel }}</label>
          <input
            id="project-name"
            type="text"
            hlmInput
            [formField]="createForm.name"
            [placeholder]="messages.create.namePlaceholder"
            [attr.aria-invalid]="fieldError('name') ? true : null"
          />
          @if (fieldError('name'); as message) {
            <hlm-field-error forceShow>{{ message }}</hlm-field-error>
          }
        </div>

        <div hlmField>
          <label hlmFieldLabel for="project-description">
            {{ messages.create.descriptionLabel }}
          </label>
          <textarea
            id="project-description"
            hlmTextarea
            rows="2"
            [formField]="createForm.description"
            [placeholder]="messages.create.descriptionPlaceholder"
          ></textarea>
        </div>

        <div class="flex flex-wrap gap-2">
          <button hlmBtn type="submit" [disabled]="submitting()">
            {{ submitting() ? messages.create.submitting : messages.create.submit }}
          </button>
          <button hlmBtn type="button" variant="outline" (click)="close()">
            {{ messages.create.cancel }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CreateProjectDialogComponent {
  private readonly dialogRef = inject<BrnDialogRef<ProjectResponseDto | undefined>>(BrnDialogRef);
  private readonly projectsApi = inject(ProjectsApiService);

  readonly messages = PROJECTS_MESSAGES;

  readonly showErrors = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  private readonly model = signal<CreateProjectModel>({
    name: '',
    description: '',
  });

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

  close(): void {
    this.dialogRef.close();
  }
}
