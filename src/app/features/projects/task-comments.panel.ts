import { Component, effect, inject, input, signal } from '@angular/core';
import { form, FormField, validateStandardSchema } from '@angular/forms/signals';
import { Store } from '@ngrx/store';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';

import { getApiErrorMessage } from '../../core/api/api-error';
import {
  type CommentResponseDto,
  CommentsApiService,
} from '../../core/comments/comments-api.service';
import { UserActions } from '../../core/users/user.actions';
import { selectCurrentUser } from '../../core/users/user.reducer';
import { firstFieldErrorMessage } from '../auth/auth.form-utils';
import { COMMENTS_MESSAGES } from './comments.messages';
import {
  commentContentSchema,
  type CommentContentModel,
} from './comments.schemas';

const DEFAULT_LIMIT = 50 as const;

@Component({
  selector: 'sl-task-comments-panel',
  imports: [FormField, ...HlmButtonImports, ...HlmFieldImports, ...HlmTextareaImports],
  templateUrl: './task-comments.panel.html',
})
export class TaskCommentsPanel {
  readonly taskId = input.required<string>();

  private readonly commentsApi = inject(CommentsApiService);
  private readonly store = inject(Store);

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

    this.commentsApi.findAll(taskId, { page: 1, limit: DEFAULT_LIMIT }).subscribe({
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
        this.createSubmitting.set(false);
        this.createModel.set({ content: '' });
        this.createShowErrors.set(false);
        this.comments.update((list) => [...list, created]);
      },
      error: (error: unknown) => {
        this.createSubmitting.set(false);
        this.createServerError.set(getApiErrorMessage(error));
      },
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
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
      },
      error: (error: unknown) => {
        this.editSubmitting.set(false);
        this.editServerError.set(getApiErrorMessage(error));
      },
    });
  }

  onDelete(comment: CommentResponseDto): void {
    if (!this.isAuthor(comment)) {
      return;
    }

    if (
      !globalThis.confirm(
        `${this.messages.confirm.deleteTitle}\n\n${this.messages.confirm.deleteBody}`,
      )
    ) {
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
      },
      error: (error: unknown) => {
        this.actionId.set(null);
        this.actionError.set(getApiErrorMessage(error));
      },
    });
  }
}
