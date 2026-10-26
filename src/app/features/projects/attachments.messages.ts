export const ATTACHMENTS_MESSAGES = {
  title: 'Files',
  open: 'Files',
  close: 'Hide files',
  loading: 'Loading files…',
  retry: 'Try again',
  empty: 'No files attached.',
  upload: 'Upload file',
  uploading: 'Uploading…',
  download: 'Download',
  downloading: 'Opening…',
  delete: 'Delete',
  deleting: 'Deleting…',
  confirm: {
    deleteTitle: 'Delete this file?',
    deleteBody: 'This removes the attachment from the task.',
  },
} as const;

/** Mirrors the backend's upload rules so people get feedback before uploading. */
export const ATTACHMENT_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxPerComment: 10,
  mimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'text/plain',
  ],
} as const;

export const ATTACHMENT_ACCEPT = ATTACHMENT_LIMITS.mimeTypes.join(',');

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
