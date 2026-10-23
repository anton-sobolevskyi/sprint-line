import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import { getApiErrorMessage } from '../../core/api/api-error';
import {
  type CreateTaskDto,
  type TaskResponseDto,
  type TaskStatus,
  type TasksListQuery,
  TasksApiService,
} from '../../core/tasks/tasks-api.service';
import { TASK_STATUS_ORDER, TASKS_MESSAGES } from './tasks.messages';

const DEFAULT_LIMIT = 100 as const;

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

type ProjectTasksState = {
  projectId: string | null;
  tasks: TaskResponseDto[];
  loadStatus: LoadStatus;
  loadError: string | null;
  activeQuery: string;
  activeAssignedToMe: boolean;
  activeOverdue: boolean;
  /** Used when Assigned to me is active. */
  currentUserId: string | null;
  actionTaskId: string | null;
  actionError: string | null;
};

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

/**
 * Feature-local store for a project board (provided on the board panel).
 */
export const ProjectTasksStore = signalStore(
  withState(initialState),
  withComputed((store) => ({
    hasActiveFilters: computed(
      () =>
        store.activeQuery().trim().length > 0 ||
        store.activeAssignedToMe() ||
        store.activeOverdue(),
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
  withMethods((store, tasksApi = inject(TasksApiService)) => ({
    setProjectId(projectId: string): void {
      if (store.projectId() === projectId) {
        return;
      }
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

    setFilters(filters: {
      query: string;
      assignedToMe: boolean;
      overdue: boolean;
    }): void {
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
      if (!projectId) {
        return;
      }

      patchState(store, { loadStatus: 'loading', loadError: null });

      const query = buildListQuery(store);
      tasksApi.findAll(projectId, query).subscribe({
        next: (response) => {
          patchState(store, {
            tasks: response.data,
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

    create(
      dto: CreateTaskDto,
      callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
    ): void {
      const projectId = store.projectId();
      if (!projectId) {
        return;
      }

      tasksApi.create(projectId, dto).subscribe({
        next: () => {
          callbacks?.onSuccess?.();
          // Reload respects active filters.
          const query = buildListQuery(store);
          tasksApi.findAll(projectId, query).subscribe({
            next: (response) => {
              patchState(store, {
                tasks: response.data,
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

    updateStatus(
      task: TaskResponseDto,
      status: TaskStatus,
      callbacks?: { onError?: (message: string) => void },
    ): void {
      if (task.status === status) {
        return;
      }

      const previousStatus = task.status;
      patchState(store, {
        actionError: null,
        actionTaskId: task.id,
        tasks: store
          .tasks()
          .map((item) => (item.id === task.id ? { ...item, status } : item)),
      });

      tasksApi.update(task.id, { status }).subscribe({
        next: (updated) => {
          patchState(store, {
            actionTaskId: null,
            tasks: store
              .tasks()
              .map((item) => (item.id === updated.id ? updated : item)),
          });
        },
        error: (error: unknown) => {
          const message = getApiErrorMessage(error);
          patchState(store, {
            actionTaskId: null,
            actionError: message,
            tasks: store
              .tasks()
              .map((item) =>
                item.id === task.id ? { ...item, status: previousStatus } : item,
              ),
          });
          callbacks?.onError?.(message);
        },
      });
    },

    softDelete(
      task: TaskResponseDto,
      callbacks?: { onSuccess?: () => void; onError?: (message: string) => void },
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
  })),
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
