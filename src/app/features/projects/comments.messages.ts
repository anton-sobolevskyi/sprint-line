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
  attach: {
    label: 'Attach files',
    remove: 'Remove file',
    download: 'Open file',
    deleteTitle: 'Delete this file?',
    deleteBody: 'This removes the file from the comment.',
    hint: 'Images, PDF, DOC or TXT · up to 10 MB each · max 10 per comment',
    wrongType: 'is not a supported file type.',
    tooLarge: 'is larger than 10 MB.',
    tooMany: 'A comment can have at most 10 files.',
    uploadFailed: 'The comment was posted, but a file could not be uploaded.',
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
