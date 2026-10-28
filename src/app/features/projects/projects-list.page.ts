import { AfterViewInit, Component, computed, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports, HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { getApiErrorMessage } from '../../core/api/api-error';
import {
  type PaginationMetaDto,
  type ProjectResponseDto,
  ProjectsApiService,
} from '../../core/projects/projects-api.service';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { PROJECTS_MESSAGES } from './projects.messages';
import { createProjectSchema, type CreateProjectModel } from './projects.schemas';

const DEFAULT_PAGE = 1 as const;
const DEFAULT_LIMIT = 20 as const;

@Component({
  selector: 'sl-projects-list-page',
  imports: [
    FormField,
    RouterLink,
    ...HlmButtonImports,
    ...HlmDialogImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmSkeletonImports,
    ...HlmTextareaImports,
  ],
  templateUrl: './projects-list.page.html',
})
export class ProjectsListPage implements OnInit, AfterViewInit {
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly messages = PROJECTS_MESSAGES;

  readonly projects = signal<ProjectResponseDto[]>([]);
  readonly search = signal('');

  readonly visibleProjects = computed(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) {
      return this.projects();
    }
    return this.projects().filter((project) =>
      `${project.name} ${project.description ?? ''}`.toLowerCase().includes(query)
    );
  });
  readonly pagination = signal<PaginationMetaDto | null>(null);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  readonly showCreate = signal(false);

  private readonly dialog = inject(HlmDialogService);
  private readonly createTpl = viewChild.required<TemplateRef<unknown>>('createDialog');
  private createRef: BrnDialogRef | null = null;
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
    // if (this.route.snapshot.queryParamMap.get('new') === '1') {
    //   this.openCreate();
    //   void this.router.navigate([], {
    //     relativeTo: this.route,
    //     queryParams: { new: null },
    //     queryParamsHandling: 'merge',
    //     replaceUrl: true,
    //   });
    // }
    this.load();
  }

  ngAfterViewInit(): void {
    if (this.route.snapshot.queryParamMap.get('new') === '1') {
      // defer to avoid ExpressionChangedAfterItHasBeenChecked
      queueMicrotask(() => {
        this.openCreate();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { new: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    }
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

    if (!this.createRef) {
      const ref = this.dialog.open(this.createTpl(), {
        contentClass: 'sm:max-w-md',
        showCloseButton: true,
        closeLabel: this.messages.create.cancel,
      });
      this.createRef = ref;
      ref.closed$.subscribe(() => {
        this.createRef = null;
        this.showCreate.set(false);
      });
    }
  }

  closeCreate(): void {
    this.showCreate.set(false);
    this.createRef?.close();
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
        this.closeCreate();
        void this.router.navigate(['/projects', project.id]);
      },
      error: (error: unknown) => {
        this.createSubmitting.set(false);
        this.createServerError.set(getApiErrorMessage(error));
      },
    });
  }

  /** 0-100, or null when the project has no tasks yet. */
  progressPercent(project: ProjectResponseDto): number | null {
    const total = project.taskCount ?? 0;
    return total === 0 ? null : Math.round(((project.doneTaskCount ?? 0) / total) * 100);
  }

  progressText(project: ProjectResponseDto): string {
    return this.messages.list.done
      .replace('{done}', String(project.doneTaskCount ?? 0))
      .replace('{total}', String(project.taskCount ?? 0));
  }

  memberText(project: ProjectResponseDto): string {
    const count = this.memberCount(project);
    return `${count} ${count === 1 ? this.messages.list.memberLabel : this.messages.list.membersLabel}`;
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  memberCount(project: ProjectResponseDto): number {
    return project.memberCount ?? project.members?.length ?? 0;
  }
}
