import { z } from 'zod';

import { TASKS_MESSAGES } from './tasks.messages';

const messages = TASKS_MESSAGES.validation;

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, { message: messages.titleRequired })
    .min(2, { message: messages.titleMinLength }),
  description: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

export type CreateTaskModel = z.infer<typeof createTaskSchema>;
