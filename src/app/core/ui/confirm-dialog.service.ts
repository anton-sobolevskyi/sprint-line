import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';

import { HlmDialogService } from '@spartan-ng/helm/dialog';

import { ConfirmDialogComponent } from './confirm-dialog.component';
import type { ConfirmDialogData } from './confirm-dialog.types';

/**
 * Accessible confirm dialog (replaces `window.confirm`).
 * Returns `true` only when the user explicitly confirms.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(HlmDialogService);

  confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      context: data,
      showCloseButton: true,
      closeLabel: data.cancelLabel ?? 'Cancel',
    });

    return firstValueFrom(
      ref.closed$.pipe(map((result) => result === true)),
      { defaultValue: false },
    );
  }
}
