export type ConfirmDialogData = {
  title: string;
  description: string;
  /** Defaults to UI_MESSAGES.dialog.confirm */
  confirmLabel?: string;
  /** Defaults to UI_MESSAGES.dialog.cancel */
  cancelLabel?: string;
  /** Uses destructive button styling when true. */
  destructive?: boolean;
};
