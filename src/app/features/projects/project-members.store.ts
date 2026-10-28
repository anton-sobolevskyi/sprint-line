import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { getApiErrorMessage } from '../../core/api/api-error';
import {
  type ProjectMemberResponseDto,
  type ProjectMemberRole,
  ProjectMembersApiService,
} from '../../core/projects/project-members-api.service';

const DEFAULT_PAGE = 1 as const;
const DEFAULT_LIMIT = 50 as const;

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface ProjectMembersState {
  projectId: string | null;
  members: ProjectMemberResponseDto[];
  loadStatus: LoadStatus;
  loadError: string | null;
  actionUserId: string | null;
  actionError: string | null;
}

const initialState: ProjectMembersState = {
  projectId: null,
  members: [],
  loadStatus: 'idle',
  loadError: null,
  actionUserId: null,
  actionError: null,
};

/** Feature-local store for project members (provided on the members panel). */
export const ProjectMembersStore = signalStore(
  withState(initialState),
  withMethods((store, membersApi = inject(ProjectMembersApiService)) => ({
    setProjectId(projectId: string): void {
      if (store.projectId() === projectId) {
        return;
      }
      patchState(store, {
        projectId,
        members: [],
        loadStatus: 'idle',
        loadError: null,
        actionUserId: null,
        actionError: null,
      });
    },

    load(page: number = DEFAULT_PAGE): void {
      const projectId = store.projectId();
      if (!projectId) {
        return;
      }

      patchState(store, { loadStatus: 'loading', loadError: null });

      membersApi.findAll(projectId, { page, limit: DEFAULT_LIMIT }).subscribe({
        next: (response) => {
          patchState(store, {
            members: response.data,
            loadStatus: 'success',
          });
        },
        error: (error: unknown) => {
          patchState(store, {
            loadStatus: 'error',
            loadError: getApiErrorMessage(error),
          });
        },
      });
    },

    invite(
      dto: { email: string; role: ProjectMemberRole },
      callbacks?: { onSuccess?: () => void; onError?: (message: string) => void }
    ): void {
      const projectId = store.projectId();
      if (!projectId) {
        return;
      }

      membersApi.add(projectId, dto).subscribe({
        next: () => {
          callbacks?.onSuccess?.();
          // Refresh list
          membersApi.findAll(projectId, { page: 1, limit: DEFAULT_LIMIT }).subscribe({
            next: (response) => {
              patchState(store, {
                members: response.data,
                loadStatus: 'success',
              });
            },
          });
        },
        error: (error: unknown) => {
          callbacks?.onError?.(getApiErrorMessage(error));
        },
      });
    },

    updateRole(
      member: ProjectMemberResponseDto,
      role: ProjectMemberRole,
      callbacks?: { onError?: (message: string) => void }
    ): void {
      const projectId = store.projectId();
      if (!projectId || role === member.role) {
        return;
      }

      patchState(store, { actionError: null, actionUserId: member.userId });

      membersApi.updateRole(projectId, member.userId, { role }).subscribe({
        next: () => {
          patchState(store, { actionUserId: null });
          membersApi.findAll(projectId, { page: 1, limit: DEFAULT_LIMIT }).subscribe({
            next: (response) => {
              patchState(store, {
                members: response.data,
                loadStatus: 'success',
              });
            },
          });
        },
        error: (error: unknown) => {
          const message = getApiErrorMessage(error);
          patchState(store, {
            actionUserId: null,
            actionError: message,
          });
          callbacks?.onError?.(message);
        },
      });
    },

    remove(
      userId: string,
      callbacks?: { onSuccess?: () => void; onError?: (message: string) => void }
    ): void {
      const projectId = store.projectId();
      if (!projectId) {
        return;
      }

      patchState(store, { actionError: null, actionUserId: userId });

      membersApi.remove(projectId, userId).subscribe({
        next: () => {
          patchState(store, {
            actionUserId: null,
            members: store.members().filter((m) => m.userId !== userId),
          });
          callbacks?.onSuccess?.();
        },
        error: (error: unknown) => {
          const message = getApiErrorMessage(error);
          patchState(store, {
            actionUserId: null,
            actionError: message,
          });
          callbacks?.onError?.(message);
        },
      });
    },

    transferOwnership(
      userId: string,
      callbacks?: { onSuccess?: () => void; onError?: (message: string) => void }
    ): void {
      const projectId = store.projectId();
      if (!projectId) {
        return;
      }

      patchState(store, { actionError: null, actionUserId: userId });

      membersApi.transferOwnership(projectId, userId).subscribe({
        next: () => {
          patchState(store, { actionUserId: null });
          callbacks?.onSuccess?.();
          membersApi.findAll(projectId, { page: 1, limit: DEFAULT_LIMIT }).subscribe({
            next: (response) => {
              patchState(store, {
                members: response.data,
                loadStatus: 'success',
              });
            },
          });
        },
        error: (error: unknown) => {
          const message = getApiErrorMessage(error);
          patchState(store, {
            actionUserId: null,
            actionError: message,
          });
          callbacks?.onError?.(message);
        },
      });
    },
  }))
);
