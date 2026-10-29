import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Subscription } from 'rxjs';

import { CreateTaskDto, TaskResponseDto, TaskStatus } from '@types';
import { Tasks, TasksListQuery } from '@core/services/tasks';
import { getApiErrorMessage } from '@utils';
import { TASK_STATUS_ORDER } from '@constants/config';
import { TASKS_MESSAGES } from '@constants/messages';

const DEFAULT_LIMIT = 100 as const;

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface ProjectTasksState {
  projectId: string | null;
  tasks: TaskResponseDto[];
  loadStatus: LoadStatus;
  loadError: string | null;
  activeQuery: string;
  activeAssignedToMe: boolean;
  activeOverdue: boolean;
  currentUserId: string | null;
  actionTaskId: string | null;
  actionError: string | null;
}

const initialState: ProjectTasksState = {
  projectId: null,
  tasks: [],
  loadStatus: 'idle',
  loadError: null,
  activeQuery: '',
  activeAssignedToMe: false,
  activeOverdue: false,
  currentUserId: null,
  actionTaskId: null,
  actionError: null,
};

export const ProjectTasksStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    hasActiveFilters: computed(
      () =>
        store.activeQuery().trim().length > 0 || store.activeAssignedToMe() || store.activeOverdue()
    ),
    totalVisible: computed(() => store.tasks().length),
    columns: computed(() => {
      const items = store.tasks();
      return TASK_STATUS_ORDER.map((status) => ({
        status,
        label: TASKS_MESSAGES.status[status],
        tasks: items.filter((task) => task.status === status),
      }));
    }),
  })),
  withMethods((store, tasksApi = inject(Tasks)) => {
    /** In-flight list request; replaced (and cancelled) by the next one. */
    let listSub: Subscription | null = null;

    /**
     * Fetches the task list for the current filters. A newer call cancels the previous
     * request so a slow, outdated response can never overwrite fresher data.
     * `silent` refreshes keep the board visible and report failures via `actionError`.
     */
    const fetchTasks = (projectId: string, silent: boolean): void => {
      listSub?.unsubscribe();

      if (!silent) {
        patchState(store, { loadStatus: 'loading', loadError: null });
      }

      listSub = tasksApi.findAll(projectId, buildListQuery(store)).subscribe({
        next: (response) => {
          patchState(store, { tasks: response.data, loadStatus: 'success', loadError: null });
        },
        error: (error: unknown) => {
          const message = getApiErrorMessage(error);
          patchState(
            store,
            silent ? { actionError: message } : { loadStatus: 'error', loadError: message }
          );
        },
      });
    };

    return {
      setProjectId(projectId: string): void {
        if (store.projectId() === projectId) {
          return;
        }
        listSub?.unsubscribe();
        patchState(store, {
          projectId,
          tasks: [],
          loadStatus: 'idle',
          loadError: null,
          actionTaskId: null,
          actionError: null,
        });
      },

      setCurrentUserId(userId: string | null): void {
        patchState(store, { currentUserId: userId });
      },

      setFilters(filters: { query: string; assignedToMe: boolean; overdue: boolean }): void {
        patchState(store, {
          activeQuery: filters.query.trim(),
          activeAssignedToMe: filters.assignedToMe,
          activeOverdue: filters.overdue,
        });
      },

      clearFilters(): void {
        patchState(store, {
          activeQuery: '',
          activeAssignedToMe: false,
          activeOverdue: false,
        });
      },

      load(): void {
        const projectId = store.projectId();
        if (projectId) {
          fetchTasks(projectId, false);
        }
      },

      /**
       * Creates a task. The create endpoint has no status field, so a non-default status
       * needs a second request. If that second request fails the task still exists (in
       * the default column): `onPartialSuccess` is called with the reason, falling back
       * to `onSuccess` when the caller doesn't care to distinguish.
       */
      create(
        dto: CreateTaskDto,
        callbacks?: {
          onSuccess?: () => void;
          onPartialSuccess?: (message: string) => void;
          onError?: (message: string) => void;
        },
        status?: TaskStatus
      ): void {
        const projectId = store.projectId();
        if (!projectId) {
          return;
        }

        tasksApi.create(projectId, dto).subscribe({
          next: (created) => {
            if (!status || status === created.status) {
              callbacks?.onSuccess?.();
              fetchTasks(projectId, true);
              return;
            }

            tasksApi.update(created.id, { status }).subscribe({
              next: () => {
                callbacks?.onSuccess?.();
                fetchTasks(projectId, true);
              },
              error: (error: unknown) => {
                const message = getApiErrorMessage(error);
                if (callbacks?.onPartialSuccess) {
                  callbacks.onPartialSuccess(message);
                } else {
                  callbacks?.onSuccess?.();
                }
                fetchTasks(projectId, true);
              },
            });
          },
          error: (error: unknown) => {
            callbacks?.onError?.(getApiErrorMessage(error));
          },
        });
      },

      updateStatus(
        task: TaskResponseDto,
        status: TaskStatus,
        callbacks?: { onError?: (message: string) => void }
      ): void {
        if (task.status === status) {
          return;
        }

        const previousStatus = task.status;
        patchState(store, {
          actionError: null,
          actionTaskId: task.id,
          tasks: store.tasks().map((item) => (item.id === task.id ? { ...item, status } : item)),
        });

        tasksApi.update(task.id, { status }).subscribe({
          next: (updated) => {
            patchState(store, {
              actionTaskId: null,
              tasks: store.tasks().map((item) => (item.id === updated.id ? updated : item)),
            });
          },
          error: (error: unknown) => {
            const message = getApiErrorMessage(error);
            patchState(store, {
              actionTaskId: null,
              actionError: message,
              tasks: store
                .tasks()
                .map((item) => (item.id === task.id ? { ...item, status: previousStatus } : item)),
            });
            callbacks?.onError?.(message);
          },
        });
      },

      softDelete(
        task: TaskResponseDto,
        callbacks?: { onSuccess?: () => void; onError?: (message: string) => void }
      ): void {
        patchState(store, { actionError: null, actionTaskId: task.id });

        tasksApi.softDelete(task.id).subscribe({
          next: () => {
            patchState(store, {
              actionTaskId: null,
              tasks: store.tasks().filter((item) => item.id !== task.id),
            });
            callbacks?.onSuccess?.();
          },
          error: (error: unknown) => {
            const message = getApiErrorMessage(error);
            patchState(store, {
              actionTaskId: null,
              actionError: message,
            });
            callbacks?.onError?.(message);
          },
        });
      },
    };
  })
);

function buildListQuery(store: {
  activeQuery: () => string;
  activeAssignedToMe: () => boolean;
  activeOverdue: () => boolean;
  currentUserId: () => string | null;
}): TasksListQuery {
  const query: TasksListQuery = { page: 1, limit: DEFAULT_LIMIT };

  const q = store.activeQuery().trim();
  if (q.length > 0) {
    query.q = q;
  }

  if (store.activeAssignedToMe()) {
    const userId = store.currentUserId();
    if (userId) {
      query.assignedToId = userId;
    }
  }

  if (store.activeOverdue()) {
    query.dueBefore = new Date().toISOString();
  }

  return query;
}
