import { z } from 'zod';

import { PROJECTS_MESSAGES } from './projects.messages';

const messages = PROJECTS_MESSAGES.validation;

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: messages.nameRequired })
    .min(2, { message: messages.nameMinLength }),
  description: z.string(),
});

export type CreateProjectModel = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: messages.nameRequired })
    .min(2, { message: messages.nameMinLength }),
  description: z.string(),
});

export type UpdateProjectModel = z.infer<typeof updateProjectSchema>;
