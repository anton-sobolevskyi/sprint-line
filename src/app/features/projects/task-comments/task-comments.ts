import { Component, effect, inject, input, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../../core/users/user.reducer';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { UserActions } from '../../../core/users/user.actions';
import { firstFieldErrorMessage, formatFileSize, getApiErrorMessage } from '../../../utils';
import { forkJoin } from 'rxjs';
import { appToast } from '../../../core/ui/toast';
import { UI_MESSAGES } from '../../../core/ui/ui.messages';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { CommentContentModel, commentContentSchema } from './task-comments.schema';
import { AttachmentResponseDto, CommentResponseDto } from '@types';
import { Comments } from '@core/services/comments';
import { Attachments } from '@core/services/attachments';
import { COMMENTS_MESSAGES } from '@constants/messages';
import { ATTACHMENT_ACCEPT, ATTACHMENT_LIMITS, COMMENTS_DEFAULT_LIMIT } from '@constants/config';
import { Dialog } from '@core/services/dialog';

@Component({
  imports: [HlmFieldImports, HlmTextareaImports, FormField, HlmButtonImports],
  selector: 'sl-task-comments',
  styleUrl: './task-comments.scss',
  templateUrl: './task-comments.html',
})
export class TaskComments {
  readonly taskId = input.required<string>();

  private readonly commentsApi = inject(Comments);
  private readonly attachmentsApi = inject(Attachments);
  private readonly store = inject(Store);
  private readonly dialog = inject(Dialog);

  readonly messages = COMMENTS_MESSAGES;
  readonly currentUser = this.store.selectSignal(selectCurrentUser);

  readonly comments = signal<CommentResponseDto[]>([]);
  readonly loadStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly loadError = signal<string | null>(null);

  readonly createShowErrors = signal(false);
  readonly createSubmitting = signal(false);
  readonly createServerError = signal<string | null>(null);

  readonly editingId = signal<string | null>(null);
  readonly editShowErrors = signal(false);
  readonly editSubmitting = signal(false);
  readonly editServerError = signal<string | null>(null);

  /** Files chosen in the composer, uploaded right after the comment is posted. */
  readonly pendingFiles = signal<File[]>([]);
  readonly attachError = signal<string | null>(null);
  readonly attachAccept = ATTACHMENT_ACCEPT;

  readonly actionId = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  private readonly createModel = signal<CommentContentModel>({ content: '' });
  readonly createForm = form(this.createModel, (schemaPath) => {
    validateStandardSchema(schemaPath, commentContentSchema);
  });

  private readonly editModel = signal<CommentContentModel>({ content: '' });
  readonly editForm = form(this.editModel, (schemaPath) => {
    validateStandardSchema(schemaPath, commentContentSchema);
  });

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

    this.commentsApi.findAll(taskId, { page: 1, limit: COMMENTS_DEFAULT_LIMIT }).subscribe({
      next: (response) => {
        this.comments.set(response.data);
        this.loadStatus.set('success');
      },
      error: (error: unknown) => {
        this.loadStatus.set('error');
        this.loadError.set(getApiErrorMessage(error));
      },
    });
  }

  authorInitials(comment: CommentResponseDto): string {
    const name = this.authorName(comment).trim();
    const parts = name.split(/\s+/).filter(Boolean);
    const letters =
      parts.length > 1 ? parts[0]![0]! + parts[parts.length - 1]![0]! : name.slice(0, 2);
    return letters.toUpperCase();
  }

  /** "2 hours ago", "yesterday" ... falls back to the date for older comments. */
  timeAgo(comment: CommentResponseDto): string {
    const created = new Date(comment.createdAt).getTime();
    if (Number.isNaN(created)) {
      return '';
    }
    const seconds = Math.round((created - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const steps: [Intl.RelativeTimeFormatUnit, number][] = [
      ['minute', 60],
      ['hour', 3600],
      ['day', 86400],
    ];
    if (Math.abs(seconds) < 60) {
      return rtf.format(0, 'second');
    }
    for (let i = steps.length - 1; i >= 0; i--) {
      const [unit, size] = steps[i]!;
      if (Math.abs(seconds) >= size) {
        if (unit === 'day' && Math.abs(seconds) >= 7 * 86400) {
          return new Date(created).toLocaleDateString('en', { month: 'short', day: 'numeric' });
        }
        return rtf.format(Math.round(seconds / size), unit);
      }
    }
    return '';
  }

  authorName(comment: CommentResponseDto): string {
    return comment.author?.name ?? comment.authorId;
  }

  isAuthor(comment: CommentResponseDto): boolean {
    return comment.authorId === this.currentUser()?.id;
  }

  createError(): string | null {
    if (!this.createShowErrors() && !this.createForm.content().touched()) {
      return null;
    }
    return firstFieldErrorMessage(this.createForm.content().errors());
  }

  editError(): string | null {
    if (!this.editShowErrors() && !this.editForm.content().touched()) {
      return null;
    }
    return firstFieldErrorMessage(this.editForm.content().errors());
  }

  onCreateSubmit(event: Event): void {
    event.preventDefault();
    this.createServerError.set(null);
    this.createShowErrors.set(true);

    if (this.createForm().invalid() || this.createSubmitting()) {
      return;
    }

    this.createSubmitting.set(true);
    const { content } = this.createModel();

    this.commentsApi.create(this.taskId(), { content: content.trim() }).subscribe({
      next: (created) => {
        const files = this.pendingFiles();
        if (files.length === 0) {
          this.finishCreate(created);
          return;
        }

        forkJoin(
          files.map((file) => this.attachmentsApi.uploadForComment(created.id, file))
        ).subscribe({
          next: (uploaded) =>
            this.finishCreate({
              ...created,
              attachments: [...(created.attachments ?? []), ...uploaded],
            }),
          error: () => {
            this.finishCreate(created);
            this.actionError.set(this.messages.attach.uploadFailed);
          },
        });
      },
      error: (error: unknown) => {
        this.createSubmitting.set(false);
        this.createServerError.set(getApiErrorMessage(error));
      },
    });
  }

  private finishCreate(created: CommentResponseDto): void {
    this.createSubmitting.set(false);
    this.createModel.set({ content: '' });
    this.createShowErrors.set(false);
    this.pendingFiles.set([]);
    this.attachError.set(null);
    this.comments.update((list) => [...list, created]);
    appToast.success(this.messages.create.submit);
  }

  onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []);
    input.value = '';

    const accepted: File[] = [];
    let error: string | null = null;

    for (const file of picked) {
      if (!(ATTACHMENT_LIMITS.mimeTypes as readonly string[]).includes(file.type)) {
        error = `${file.name} ${this.messages.attach.wrongType}`;
      } else if (file.size > ATTACHMENT_LIMITS.maxBytes) {
        error = `${file.name} ${this.messages.attach.tooLarge}`;
      } else if (this.pendingFiles().length + accepted.length >= ATTACHMENT_LIMITS.maxPerComment) {
        error = this.messages.attach.tooMany;
        break;
      } else {
        accepted.push(file);
      }
    }

    this.attachError.set(error);
    if (accepted.length > 0) {
      this.pendingFiles.update((list) => [...list, ...accepted]);
    }
  }

  removePending(index: number): void {
    this.pendingFiles.update((list) => list.filter((_, i) => i !== index));
    this.attachError.set(null);
  }

  sizeLabel(bytes: number): string {
    return formatFileSize(bytes);
  }

  canDeleteAttachment(attachment: AttachmentResponseDto): boolean {
    return attachment.uploadedById === this.currentUser()?.id;
  }

  onDownloadAttachment(attachment: AttachmentResponseDto): void {
    this.actionError.set(null);
    this.attachmentsApi.getDownloadUrl(attachment.id).subscribe({
      next: (response) => globalThis.open(response.url, '_blank', 'noopener,noreferrer'),
      error: (error: unknown) => this.actionError.set(getApiErrorMessage(error)),
    });
  }

  async onDeleteAttachment(
    comment: CommentResponseDto,
    attachment: AttachmentResponseDto
  ): Promise<void> {
    if (!this.canDeleteAttachment(attachment)) {
      return;
    }

    const confirmed = await this.dialog.confirm({
      title: this.messages.attach.deleteTitle,
      description: this.messages.attach.deleteBody,
      confirmLabel: UI_MESSAGES.dialog.delete,
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    this.attachmentsApi.remove(attachment.id).subscribe({
      next: () =>
        this.comments.update((list) =>
          list.map((item) =>
            item.id === comment.id
              ? {
                  ...item,
                  attachments: (item.attachments ?? []).filter((a) => a.id !== attachment.id),
                }
              : item
          )
        ),
      error: (error: unknown) => this.actionError.set(getApiErrorMessage(error)),
    });
  }

  startEdit(comment: CommentResponseDto): void {
    this.editingId.set(comment.id);
    this.editModel.set({ content: comment.content });
    this.editShowErrors.set(false);
    this.editServerError.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editModel.set({ content: '' });
    this.editServerError.set(null);
  }

  onEditSubmit(event: Event, comment: CommentResponseDto): void {
    event.preventDefault();
    if (!this.isAuthor(comment)) {
      return;
    }

    this.editServerError.set(null);
    this.editShowErrors.set(true);

    if (this.editForm().invalid() || this.editSubmitting()) {
      return;
    }

    this.editSubmitting.set(true);
    const { content } = this.editModel();

    this.commentsApi.update(comment.id, { content: content.trim() }).subscribe({
      next: (updated) => {
        this.editSubmitting.set(false);
        this.editingId.set(null);
        this.comments.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item))
        );
      },
      error: (error: unknown) => {
        this.editSubmitting.set(false);
        this.editServerError.set(getApiErrorMessage(error));
      },
    });
  }

  async onDelete(comment: CommentResponseDto): Promise<void> {
    if (!this.isAuthor(comment)) {
      return;
    }

    const confirmed = await this.dialog.confirm({
      title: this.messages.confirm.deleteTitle,
      description: this.messages.confirm.deleteBody,
      confirmLabel: UI_MESSAGES.dialog.delete,
      destructive: true,
    });
    if (!confirmed) {
      return;
    }

    this.actionError.set(null);
    this.actionId.set(comment.id);

    this.commentsApi.softDelete(comment.id).subscribe({
      next: () => {
        this.actionId.set(null);
        if (this.editingId() === comment.id) {
          this.cancelEdit();
        }
        this.comments.update((list) => list.filter((item) => item.id !== comment.id));
        appToast.success(this.messages.actions.delete);
      },
      error: (error: unknown) => {
        this.actionId.set(null);
        this.actionError.set(getApiErrorMessage(error));
        appToast.error(getApiErrorMessage(error));
      },
    });
  }
}
