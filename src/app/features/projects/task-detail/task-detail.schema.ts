import { z } from 'zod';
import { TASKS_MESSAGES } from '@constants/messages';

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, { message: TASKS_MESSAGES.validation.titleRequired })
    .min(2, { message: TASKS_MESSAGES.validation.titleMinLength }),
  description: z.string(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.string(),
  assignedToId: z.string(),
});

export type UpdateTaskModel = z.infer<typeof updateTaskSchema>;
