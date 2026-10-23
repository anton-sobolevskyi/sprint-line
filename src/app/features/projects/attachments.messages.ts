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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
