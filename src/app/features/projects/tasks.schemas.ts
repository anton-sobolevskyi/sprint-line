import { z } from 'zod';

import { TASKS_MESSAGES } from './tasks.messages';

const messages = TASKS_MESSAGES.validation;

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, { message: messages.titleRequired })
    .min(2, { message: messages.titleMinLength }),
  description: z.string(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  /** yyyy-mm-dd or empty. */
  dueDate: z.string(),
  /** Member user id or empty (unassigned). */
  assignedToId: z.string(),
});

export type CreateTaskModel = z.infer<typeof createTaskSchema>;

/** Empty string means unassigned / no due date in the UI model. */
export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, { message: messages.titleRequired })
    .min(2, { message: messages.titleMinLength }),
  description: z.string(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string(),
  assignedToId: z.string(),
});

export type UpdateTaskModel = z.infer<typeof updateTaskSchema>;
