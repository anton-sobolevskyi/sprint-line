import { z } from 'zod';

import { COMMENTS_MESSAGES } from '../../../constants';

export const commentContentSchema = z.object({
  content: z
    .string()
    .min(1, { message: COMMENTS_MESSAGES.validation.contentRequired })
    .min(2, { message: COMMENTS_MESSAGES.validation.contentMinLength }),
});

export type CommentContentModel = z.infer<typeof commentContentSchema>;
