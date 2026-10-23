export const TASKS_MESSAGES = {
  title: 'Board',
  description: 'Tasks grouped by status.',
  loading: 'Loading tasks…',
  retry: 'Try again',
  emptyColumn: 'No tasks',
  create: {
    title: 'New task',
    titleLabel: 'Title',
    titlePlaceholder: 'Design homepage layout',
    descriptionLabel: 'Description (optional)',
    descriptionPlaceholder: 'Optional details',
    priorityLabel: 'Priority',
    submit: 'Add task',
    submitting: 'Adding…',
    success: 'Task created.',
  },
  status: {
    TODO: 'To do',
    IN_PROGRESS: 'In progress',
    IN_REVIEW: 'In review',
    DONE: 'Done',
  },
  priority: {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  },
  actions: {
    changeStatus: 'Status',
    delete: 'Delete',
    deleting: 'Deleting…',
  },
  confirm: {
    deleteTitle: 'Delete this task?',
    deleteBody: 'The task will be soft-deleted.',
  },
  validation: {
    titleRequired: 'Title is required.',
    titleMinLength: 'Title must be at least 2 characters.',
  },
} as const;

export const TASK_STATUS_ORDER = [
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
] as const;
