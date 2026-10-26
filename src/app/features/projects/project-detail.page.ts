import { Component, effect, inject, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { getApiErrorMessage } from '../../core/api/api-error';
import { ConfirmDialogService } from '../../core/ui/confirm-dialog.service';
import { appToast } from '../../core/ui/toast';
import { UI_MESSAGES } from '../../core/ui/ui.messages';
import {
  type ProjectResponseDto,
  ProjectsApiService,
} from '../../core/projects/projects-api.service';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { ProjectMembersPanel } from './project-members.panel';
import { ProjectTasksBoardPanel } from './project-tasks-board.panel';
import { PROJECTS_MESSAGES } from './projects.messages';
import {
  type UpdateProjectModel,
  updateProjectSchema,
} from './projects.schemas';

export type ProjectDetailTab = 'board' | 'members' | 'settings';

const TAB_VALUES: readonly ProjectDetailTab[] = ['board', 'members', 'settings'] as const;

function parseTab(value: string | null): ProjectDetailTab {
  if (value === 'members' || value === 'settings' || value === 'board') {
    return value;
  }
  return 'board';
}

@Component({
  selector: 'sl-project-detail-page',
  imports: [
    FormField,
    RouterLink,
    ProjectMembersPanel,
    ProjectTasksBoardPanel,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmFieldImports,
    ...HlmInputImports,
    ...HlmSkeletonImports,
    ...HlmTextareaImports,
  ],
  templateUrl: './project-detail.page.html',
})
export class ProjectDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly messages = PROJECTS_MESSAGES;
  readonly tabValues = TAB_VALUES;

  readonly project = signal<ProjectResponseDto | null>(null);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  /** Active section — board is the default hero. */
  readonly activeTab = signal<ProjectDetailTab>('board');

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
  private readonly loadedProjectId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id || this.loadedProjectId() === id) {
        return;
      }
      this.loadedProjectId.set(id);
      this.load(id);
    });

    effect(() => {
      const tab = parseTab(this.route.snapshot.queryParamMap.get('tab'));
      this.activeTab.set(tab);
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
    this.loadStatus.set('loading');
    this.loadError.set(null);

    this.projectsApi.findOne(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadedProjectId.set(null);
      this.load(id);
      this.loadedProjectId.set(id);
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

  async onDelete(): Promise<void> {
    const project = this.project();
    if (!project || this.deleteSubmitting()) {
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
}
