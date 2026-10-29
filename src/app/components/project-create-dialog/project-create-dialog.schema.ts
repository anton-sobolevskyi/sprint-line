import { z } from 'zod';
import { PROJECTS_MESSAGES } from '@constants/messages';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: PROJECTS_MESSAGES.validation.nameRequired })
    .min(2, { message: PROJECTS_MESSAGES.validation.nameMinLength }),
  description: z.string(),
});

export type CreateProjectModel = z.infer<typeof createProjectSchema>;
