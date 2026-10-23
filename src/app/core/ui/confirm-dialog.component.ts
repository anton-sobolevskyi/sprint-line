import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

import type { ConfirmDialogData } from './confirm-dialog.types';
import { UI_MESSAGES } from './ui.messages';

@Component({
  selector: 'sl-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HlmButtonImports, ...HlmDialogImports],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <h2 hlmDialogTitle>{{ data.title }}</h2>
        <p hlmDialogDescription class="whitespace-pre-wrap">{{ data.description }}</p>
      </div>

      <div hlmDialogFooter>
        <button hlmBtn type="button" variant="outline" (click)="onCancel()">
          {{ data.cancelLabel || messages.dialog.cancel }}
        </button>
        <button
          hlmBtn
          type="button"
          [variant]="data.destructive ? 'destructive' : 'default'"
          (click)="onConfirm()"
        >
          {{ data.confirmLabel || messages.dialog.confirm }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
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
