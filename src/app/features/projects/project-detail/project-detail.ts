import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { PROJECTS_MESSAGES } from '../../../constants';
import {
  type ProjectResponseDto,
  ProjectsApiService,
} from '../../../core/projects/projects-api.service';
import { ConfirmDialogService } from '../../../core/ui/confirm-dialog.service';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { getApiErrorMessage } from '../../../core/api/api-error';
import { firstFieldErrorMessage } from '../../../utils';
import { appToast } from '../../../core/ui/toast';
import { UI_MESSAGES } from '../../../core/ui/ui.messages';
import { ProjectMembers } from '../project-members/project-members';
import { ProjectTasks } from '../project-tasks/project-tasks';
import { ProjectDetailTab } from './project-detail.types';
import { UpdateProjectModel, updateProjectSchema } from './project-detail.schema';

@Component({
  imports: [
    HlmButton,
    HlmField,
    HlmFieldError,
    HlmFieldLabel,
    HlmInput,
    HlmSkeleton,
    HlmTextarea,
    ProjectMembers,
    ProjectTasks,
    RouterLink,
    RouterOutlet,
    FormField,
  ],
  selector: 'sl-project-detail',
  styleUrl: './project-detail.scss',
  templateUrl: './project-detail.html',
})
export class ProjectDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly messages = PROJECTS_MESSAGES;
  readonly tabValues: ProjectDetailTab[] = ['board', 'members', 'settings'] as const;

  readonly project = signal<ProjectResponseDto | null>(null);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  /** Active section — board is the default hero. */
  readonly activeTab = signal<ProjectDetailTab>('board');

  readonly tabs: readonly { id: ProjectDetailTab; label: string }[] = [
    { id: 'board', label: this.messages.detail.sections.board },
    { id: 'members', label: this.messages.detail.sections.members },
    { id: 'settings', label: this.messages.detail.sections.settings },
  ];

  readonly settingsShowErrors = signal(false);
  readonly settingsSubmitting = signal(false);
  readonly settingsServerError = signal<string | null>(null);
  readonly settingsSuccess = signal<string | null>(null);

  readonly deleteSubmitting = signal(false);
  readonly deleteError = signal<string | null>(null);

  private readonly settingsModel = signal<UpdateProjectModel>({
    name: '',
    description: '',
  });

  readonly settingsForm = form(this.settingsModel, (schemaPath) => {
    validateStandardSchema(schemaPath, updateProjectSchema);
  });

  private readonly syncedProjectId = signal<string | null>(null);

  /** Reactive route state: the component is reused when navigating between projects. */
  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });
  private readonly projectIdParam = computed(() => this.paramMap().get('id'));

  /** Incremented per request so a slow response for a previous project is ignored. */
  private loadSeq = 0;

  constructor() {
    effect(() => {
      const id = this.projectIdParam();
      if (!id) {
        return;
      }
      untracked(() => {
        this.project.set(null);
        this.load(id);
      });
    });

    effect(() => {
      this.activeTab.set(this.parseTab(this.queryParamMap().get('tab')));
    });

    effect(() => {
      const project = this.project();
      if (!project || this.syncedProjectId() === project.id) {
        return;
      }
      this.syncedProjectId.set(project.id);
      this.settingsModel.set({
        name: project.name,
        description: project.description ?? '',
      });
    });
  }

  setTab(tab: ProjectDetailTab): void {
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: tab === 'board' ? { tab: null } : { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  load(id: string): void {
    const seq = ++this.loadSeq;
    this.loadStatus.set('loading');
    this.loadError.set(null);

    this.projectsApi.findOne(id).subscribe({
      next: (project) => {
        if (seq !== this.loadSeq) {
          return;
        }
        this.project.set(project);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        if (seq !== this.loadSeq) {
          return;
        }
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });
  }

  reload(): void {
    const id = this.projectIdParam();
    if (id) {
      this.load(id);
    }
  }

  settingsFieldError(field: 'name' | 'description'): string | null {
    const state = this.settingsForm[field]();
    if (!this.settingsShowErrors() && !state.touched()) {
      return null;
    }
    return firstFieldErrorMessage(state.errors());
  }

  onSaveSettings(event: Event): void {
    event.preventDefault();
    const project = this.project();
    if (!project) {
      return;
    }

    this.settingsServerError.set(null);
    this.settingsSuccess.set(null);
    this.settingsShowErrors.set(true);

    if (this.settingsForm().invalid() || this.settingsSubmitting()) {
      return;
    }

    this.settingsSubmitting.set(true);
    const { name, description } = this.settingsModel();

    this.projectsApi
      .update(project.id, {
        name,
        description: description.trim().length > 0 ? description.trim() : '',
      })
      .subscribe({
        next: (updated) => {
          this.settingsSubmitting.set(false);
          this.project.set(updated);
          this.syncedProjectId.set(null);
          this.settingsSuccess.set(this.messages.detail.saveSuccess);
          appToast.success(this.messages.detail.saveSuccess);
        },
        error: (error: unknown) => {
          this.settingsSubmitting.set(false);
          this.settingsServerError.set(getApiErrorMessage(error));
        },
      });
  }

  readonly deleteConfirmText = signal('');

  readonly canDelete = computed(
    () => !!this.project() && this.deleteConfirmText().trim() === this.project()!.name.trim()
  );

  onDeleteConfirmInput(event: Event): void {
    this.deleteConfirmText.set((event.target as HTMLInputElement).value);
  }

  async onDelete(): Promise<void> {
    const project = this.project();
    if (!project || this.deleteSubmitting() || !this.canDelete()) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.messages.detail.deleteConfirmTitle,
      description: this.messages.detail.deleteConfirmBody,
      confirmLabel: UI_MESSAGES.dialog.delete,
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    this.deleteError.set(null);
    this.deleteSubmitting.set(true);

    this.projectsApi.softDelete(project.id).subscribe({
      next: () => {
        this.deleteSubmitting.set(false);
        appToast.success(this.messages.detail.delete);
        void this.router.navigateByUrl('/projects');
      },
      error: (error: unknown) => {
        this.deleteSubmitting.set(false);
        this.deleteError.set(getApiErrorMessage(error));
        appToast.error(getApiErrorMessage(error));
      },
    });
  }

  private parseTab(value: string | null): ProjectDetailTab {
    if (value === 'members' || value === 'settings' || value === 'board') {
      return value;
    }
    return 'board';
  }
}
