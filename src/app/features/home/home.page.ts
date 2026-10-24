import { Component, computed, inject, OnInit, signal } from '@angular/core';
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

  /** Sum of memberCount on the recent page (approximate team presence). */
  readonly recentMemberSeats = computed(() =>
    this.projects().reduce((sum, project) => sum + this.memberCount(project), 0),
  );

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
    const hour = new Date().getHours();
    let plain: string;
    let named: string;

    if (hour < 12) {
      plain = this.messages.greetingMorning;
      named = this.messages.greetingMorningNamed;
    } else if (hour < 18) {
      plain = this.messages.greetingAfternoon;
      named = this.messages.greetingAfternoonNamed;
    } else {
      plain = this.messages.greetingEvening;
      named = this.messages.greetingEveningNamed;
    }

    if (!name) {
      return plain;
    }
    return named.replace('{name}', name);
  }

  memberCount(project: ProjectResponseDto): number {
    return project.memberCount ?? project.members?.length ?? 0;
  }

  projectInitial(project: ProjectResponseDto): string {
    const name = project.name?.trim();
    if (!name) {
      return '?';
    }
    return name.slice(0, 1).toUpperCase();
  }
}
