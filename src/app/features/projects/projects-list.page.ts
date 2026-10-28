import { AfterViewInit, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';

import { getApiErrorMessage } from '../../core/api/api-error';
import {
  type PaginationMetaDto,
  type ProjectResponseDto,
  ProjectsApiService,
} from '../../core/projects/projects-api.service';
import { CreateProjectDialogComponent } from './create-project-dialog.component';
import { PROJECTS_MESSAGES } from './projects.messages';

const DEFAULT_PAGE = 1 as const;
const DEFAULT_LIMIT = 20 as const;

@Component({
  selector: 'sl-projects-list-page',
  imports: [
    RouterLink,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmInputImports,
    ...HlmSkeletonImports,
  ],
  templateUrl: './projects-list.page.html',
})
export class ProjectsListPage implements OnInit, AfterViewInit {
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(HlmDialogService);

  readonly messages = PROJECTS_MESSAGES;

  readonly projects = signal<ProjectResponseDto[]>([]);
  readonly search = signal('');

  readonly visibleProjects = computed(() => {
    const query = this.search().trim().toLowerCase();
    if (!query) {
      return this.projects();
    }
    return this.projects().filter((project) =>
      `${project.name} ${project.description ?? ''}`.toLowerCase().includes(query),
    );
  });
  readonly pagination = signal<PaginationMetaDto | null>(null);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
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
    const ref = this.dialog.open<ProjectResponseDto | undefined>(CreateProjectDialogComponent, {
      contentClass: 'sm:max-w-md',
      showCloseButton: true,
      closeLabel: this.messages.create.cancel,
    });

    ref.closed$.subscribe((project) => {
      if (project) {
        void this.router.navigate(['/projects', project.id]);
      }
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
