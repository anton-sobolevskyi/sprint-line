import { inject, Service } from '@angular/core';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { firstValueFrom, map } from 'rxjs';
import { ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.types';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';

@Service()
export class Dialog {
  private readonly dialog = inject(HlmDialogService);

  confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialog, {
      context: data,
      showCloseButton: true,
      closeLabel: data.cancelLabel ?? 'Cancel',
    });

    return firstValueFrom(ref.closed$.pipe(map((result) => result === true)), {
      defaultValue: false,
    });
  }
}
