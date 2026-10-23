import { z } from 'zod';

import { COMMENTS_MESSAGES } from './comments.messages';

const messages = COMMENTS_MESSAGES.validation;

export const commentContentSchema = z.object({
  content: z
    .string()
    .min(1, { message: messages.contentRequired })
    .min(2, { message: messages.contentMinLength }),
});

export type CommentContentModel = z.infer<typeof commentContentSchema>;
