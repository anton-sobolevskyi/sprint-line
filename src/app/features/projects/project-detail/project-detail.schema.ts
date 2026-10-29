import { z } from 'zod';

import { PROJECTS_MESSAGES } from '../../../constants';

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: PROJECTS_MESSAGES.validation.nameRequired })
    .min(2, { message: PROJECTS_MESSAGES.validation.nameMinLength }),
  description: z.string(),
});

export type UpdateProjectModel = z.infer<typeof updateProjectSchema>;
