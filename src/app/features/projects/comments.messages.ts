export const COMMENTS_MESSAGES = {
  title: 'Comments',
  loading: 'Loading comments…',
  retry: 'Try again',
  empty: 'No comments yet.',
  open: 'Comments',
  close: 'Hide comments',
  create: {
    label: 'Write a comment',
    placeholder: 'Share an update…',
    submit: 'Post',
    submitting: 'Posting…',
  },
  edit: {
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
  },
  actions: {
    edit: 'Edit',
    delete: 'Delete',
    deleting: 'Deleting…',
  },
  confirm: {
    deleteTitle: 'Delete this comment?',
    deleteBody: 'The comment will be soft-deleted.',
  },
  validation: {
    contentRequired: 'Comment cannot be empty.',
    contentMinLength: 'Comment must be at least 2 characters.',
  },
} as const;
