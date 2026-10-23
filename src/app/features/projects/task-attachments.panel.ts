import { Component, effect, inject, input, signal } from '@angular/core';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';

import { getApiErrorMessage } from '../../core/api/api-error';
import { ConfirmDialogService } from '../../core/ui/confirm-dialog.service';
import { appToast } from '../../core/ui/toast';
import { UI_MESSAGES } from '../../core/ui/ui.messages';
import {
  type AttachmentResponseDto,
  AttachmentsApiService,
} from '../../core/attachments/attachments-api.service';
import { UserActions } from '../../core/users/user.actions';
import { selectCurrentUser } from '../../core/users/user.reducer';
import {
  ATTACHMENTS_MESSAGES,
  formatFileSize,
} from './attachments.messages';

@Component({
  selector: 'sl-task-attachments-panel',
  imports: [...HlmButtonImports],
  templateUrl: './task-attachments.panel.html',
})
export class TaskAttachmentsPanel {
  readonly taskId = input.required<string>();

  private readonly attachmentsApi = inject(AttachmentsApiService);
  private readonly store = inject(Store);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly messages = ATTACHMENTS_MESSAGES;
  readonly currentUser = this.store.selectSignal(selectCurrentUser);

  readonly attachments = signal<AttachmentResponseDto[]>([]);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  readonly actionId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  private readonly loadedForTaskId = signal<string | null>(null);

  constructor() {
    if (!this.currentUser()) {
      this.store.dispatch(UserActions.loadMe());
    }

    effect(() => {
      const taskId = this.taskId();
      if (!taskId || this.loadedForTaskId() === taskId) {
        return;
      }
      this.loadedForTaskId.set(taskId);
      this.load();
    });
  }

  load(): void {
    const taskId = this.taskId();
    if (!taskId) {
      return;
    }

    this.loadStatus.set('loading');
    this.loadError.set(null);

    this.attachmentsApi.findAllForTask(taskId).subscribe({
      next: (items) => {
        this.attachments.set(items);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });
  }

  sizeLabel(bytes: number): string {
    return formatFileSize(bytes);
  }

  canDelete(attachment: AttachmentResponseDto): boolean {
    return attachment.uploadedById === this.currentUser()?.id;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file || this.uploading()) {
      return;
    }

    this.uploadError.set(null);
    this.uploading.set(true);

    this.attachmentsApi.uploadForTask(this.taskId(), file).subscribe({
      next: (created) => {
        this.uploading.set(false);
        this.attachments.update((list) => [...list, created]);
        appToast.success(this.messages.upload);
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        this.uploadError.set(getApiErrorMessage(error));
      },
    });
  }

  onDownload(attachment: AttachmentResponseDto): void {
    this.actionError.set(null);
    this.actionId.set(attachment.id);

    this.attachmentsApi.getDownloadUrl(attachment.id).subscribe({
      next: (response) => {
        this.actionId.set(null);
        globalThis.open(response.url, '_blank', 'noopener,noreferrer');
      },
      error: (error: unknown) => {
        this.actionId.set(null);
        this.actionError.set(getApiErrorMessage(error));
      },
    });
  }

  async onDelete(attachment: AttachmentResponseDto): Promise<void> {
    if (!this.canDelete(attachment)) {
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: this.messages.confirm.deleteTitle,
      description: this.messages.confirm.deleteBody,
      confirmLabel: UI_MESSAGES.dialog.delete,
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    this.actionError.set(null);
    this.actionId.set(attachment.id);

    this.attachmentsApi.remove(attachment.id).subscribe({
      next: () => {
        this.actionId.set(null);
        this.attachments.update((list) =>
          list.filter((item) => item.id !== attachment.id),
        );
        appToast.success(this.messages.delete);
      },
      error: (error: unknown) => {
        this.actionId.set(null);
        this.actionError.set(getApiErrorMessage(error));
        appToast.error(getApiErrorMessage(error));
      },
    });
  }
}
