import { Component, inject } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogDescription, HlmDialogFooter, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { UI_MESSAGES } from '@core/ui/ui.messages';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { ConfirmDialogData } from './confirm-dialog.types';

@Component({
  imports: [HlmButton, HlmDialogDescription, HlmDialogFooter, HlmDialogTitle],
  selector: 'sl-confirm-dialog',
  styleUrl: './confirm-dialog.scss',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  readonly data = injectBrnDialogContext<ConfirmDialogData>();
  readonly messages = UI_MESSAGES;

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
