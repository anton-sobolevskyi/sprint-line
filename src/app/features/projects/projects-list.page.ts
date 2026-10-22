import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { getApiErrorMessage } from '../../core/api/api-error';
import {
  type PaginationMetaDto,
  type ProjectResponseDto,
  ProjectsApiService,
} from '../../core/projects/projects-api.service';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { PROJECTS_MESSAGES } from './projects.messages';
import {
  createProjectSchema,
  type CreateProjectModel,
} from './projects.schemas';

const DEFAULT_PAGE = 1 as const;
const DEFAULT_LIMIT = 20 as const;

@Component({
  selector: 'sl-projects-list-page',
  imports: [
    FormField,
    RouterLink,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmTextareaImports,
  ],
  templateUrl: './projects-list.page.html',
})
export class ProjectsListPage implements OnInit {
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly router = inject(Router);

  readonly messages = PROJECTS_MESSAGES;

  readonly projects = signal<ProjectResponseDto[]>([]);
  readonly pagination = signal<PaginationMetaDto | null>(null);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  readonly showCreate = signal(false);
  readonly createShowErrors = signal(false);
  readonly createSubmitting = signal(false);
  readonly createServerError = signal<string | null>(null);

  private readonly createModel = signal<CreateProjectModel>({
    name: '',
    description: '',
  });

  readonly createForm = form(this.createModel, (schemaPath) => {
    validateStandardSchema(schemaPath, createProjectSchema);
  });

  ngOnInit(): void {
    this.load();
  }

  load(page: number = DEFAULT_PAGE): void {
    this.loadStatus.set('loading');
    this.loadError.set(null);

    this.projectsApi.findAll({ page, limit: DEFAULT_LIMIT }).subscribe({
      next: (response) => {
        this.projects.set(response.data);
        this.pagination.set(response.meta);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });
  }

  openCreate(): void {
    this.createServerError.set(null);
    this.createShowErrors.set(false);
    this.createModel.set({ name: '', description: '' });
    this.showCreate.set(true);
  }

  closeCreate(): void {
    this.showCreate.set(false);
  }

  createFieldError(field: 'name' | 'description'): string | null {
    const state = this.createForm[field]();
    if (!this.createShowErrors() && !state.touched()) {
      return null;
    }
    return firstFieldErrorMessage(state.errors());
  }

  onCreateSubmit(event: Event): void {
    event.preventDefault();
    this.createServerError.set(null);
    this.createShowErrors.set(true);

    if (this.createForm().invalid() || this.createSubmitting()) {
      return;
    }

    this.createSubmitting.set(true);
    const { name, description } = this.createModel();
    const dto = {
      name,
      ...(description.trim().length > 0 ? { description: description.trim() } : {}),
    };

    this.projectsApi.create(dto).subscribe({
      next: (project) => {
        this.createSubmitting.set(false);
        this.showCreate.set(false);
        void this.router.navigate(['/projects', project.id]);
      },
      error: (error: unknown) => {
        this.createSubmitting.set(false);
        this.createServerError.set(getApiErrorMessage(error));
      },
    });
  }

  memberCount(project: ProjectResponseDto): number {
    return project.memberCount ?? project.members?.length ?? 0;
  }
}
