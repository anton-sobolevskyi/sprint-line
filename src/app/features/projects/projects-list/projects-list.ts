import { Component, computed, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { ProjectCreateDialog } from '../../../components/project-create-dialog/project-create-dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { Projects } from '@core/services/projects';
import { PaginationMetaDto, ProjectResponseDto } from '@types';
import { getApiErrorMessage } from '@utils';
import { PROJECTS_MESSAGES } from '@constants/messages';
import { DEFAULT_PAGE, PROJECTS_LIMIT } from '@constants/config';

@Component({
  imports: [HlmButton, HlmSkeleton, RouterLink, HlmInputImports],
  selector: 'sl-projects-list',
  styleUrl: './projects-list.scss',
  templateUrl: './projects-list.html',
})
export class ProjectsList implements OnInit, AfterViewInit {
  private readonly projectsApi = inject(Projects);
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

  private readonly dialog = inject(HlmDialogService);
  private createRef: BrnDialogRef<ProjectResponseDto | undefined> | null = null;

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

    this.projectsApi.findAll({ page, limit: PROJECTS_LIMIT }).subscribe({
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
    if (this.createRef) {
      return;
    }

    const ref = this.dialog.open<ProjectResponseDto | undefined>(ProjectCreateDialog, {
      contentClass: 'sm:max-w-md',
      showCloseButton: true,
      closeLabel: this.messages.create.cancel,
    });
    this.createRef = ref;
    ref.closed$.subscribe((project) => {
      this.createRef = null;
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
