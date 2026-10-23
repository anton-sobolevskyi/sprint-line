import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';

import { getApiErrorMessage } from '../../core/api/api-error';
import {
  type ProjectResponseDto,
  ProjectsApiService,
} from '../../core/projects/projects-api.service';
import { UserActions } from '../../core/users/user.actions';
import { selectCurrentUser } from '../../core/users/user.reducer';
import { DASHBOARD_MESSAGES } from './dashboard.messages';

const RECENT_LIMIT = 6 as const;

@Component({
  selector: 'sl-home-page',
  imports: [RouterLink, ...HlmButtonImports, ...HlmCardImports, ...HlmSkeletonImports],
  templateUrl: './home.page.html',
})
export class HomePage implements OnInit {
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly store = inject(Store);

  readonly messages = DASHBOARD_MESSAGES;
  readonly currentUser = this.store.selectSignal(selectCurrentUser);

  readonly projects = signal<ProjectResponseDto[]>([]);
  readonly totalProjects = signal(0);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.currentUser()) {
      this.store.dispatch(UserActions.loadMe());
    }
    this.load();
  }

  load(): void {
    this.loadStatus.set('loading');
    this.loadError.set(null);

    this.projectsApi.findAll({ page: 1, limit: RECENT_LIMIT }).subscribe({
      next: (response) => {
        this.projects.set(response.data);
        this.totalProjects.set(response.meta.total);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });
  }

  greeting(): string {
    const name = this.currentUser()?.name?.trim();
    if (!name) {
      return this.messages.greeting;
    }
    return this.messages.greetingNamed.replace('{name}', name);
  }

  memberCount(project: ProjectResponseDto): number {
    return project.memberCount ?? project.members?.length ?? 0;
  }
}
