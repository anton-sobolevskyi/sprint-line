import { CreateTaskDto, TaskStatus } from '../../core/tasks/tasks-api.service';
import { Signal } from '@angular/core';

export interface TaskCreateMemberOption {
  id: string;
  label: string;
}

/** Data handed to the dialog by the board panel (via `HlmDialogService` context). */
export interface TaskCreateDialogData {
  /** Column/status the new task should start in. */
  initialStatus: TaskStatus;
  memberOptions: Signal<TaskCreateMemberOption[]>;
  /** Persists the task (typically `ProjectTasksStore.create`). */
  create: (
    dto: CreateTaskDto,
    callbacks: {
      onSuccess: () => void;
      onPartialSuccess: (message: string) => void;
      onError: (message: string) => void;
    },
    status: TaskStatus
  ) => void;
}
