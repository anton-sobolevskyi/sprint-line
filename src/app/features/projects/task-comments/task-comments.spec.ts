import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { authFeature } from '../../../store/auth/auth.reducer';
import { userFeature } from '../../../core/users/user.reducer';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Comments } from '@core/services/comments';
import { Attachments } from '@core/services/attachments';
import { TaskComments } from './task-comments';

describe('TaskComments', () => {
  let fixture: ComponentFixture<TaskComments>;
  const commentsApi = {
    findAll: vi.fn(() => of({ data: [], meta: { total: 0 } })),
    create: vi.fn(() => of({ id: 'c1', content: 'hi' })),
    update: vi.fn(() => of({ id: 'c1', content: 'yo' })),
    softDelete: vi.fn(() => of({ id: 'c1' })),
  };
  const attachmentsApi = {
    getDownloadUrl: vi.fn(() => of({ url: 'http://x' })),
    uploadForComment: vi.fn(() => of({ id: 'a1' })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskComments],
      providers: [
        provideStore({ [authFeature.name]: authFeature.reducer, [userFeature.name]: userFeature.reducer }),
        { provide: Comments, useValue: commentsApi },
        { provide: Attachments, useValue: attachmentsApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskComments);
    fixture.componentRef.setInput('taskId', 't1');
    fixture.detectChanges();
  });

  it('loads comments', () => {
    expect(commentsApi.findAll).toHaveBeenCalled();
  });

  it('calls utility methods', () => {
    const c = fixture.componentInstance;
    c.createError();
    c.editError();
    c.authorInitials({ author: { name: 'Ada' } } as never);
    c.timeAgo({ id:'c1', content:'hi', taskId:'t1', authorId:'u1', createdAt:'2024-01-01T00:00:00Z', updatedAt:'2024-01-01T00:00:00Z' } as never);
    c.authorName({ author: { name: 'Ada' }, authorId: 'u1' } as never);
    c.isAuthor({ authorId: 'u1' } as never);
    c.sizeLabel(1024);
    c.canDeleteAttachment({ uploadedById: 'u1' } as never);
    c.removePending(0);
  });

  it('onCreateSubmit success', () => {
    const c = fixture.componentInstance;
    (c as unknown as { createModel: { set: (v: unknown) => void } }).createModel.set({ content: 'hello' });
    const event = new Event('submit');
    vi.spyOn(event, 'preventDefault');
    c.onCreateSubmit(event);
  });

  it('onFilesPicked', () => {
    const c = fixture.componentInstance;
    const input = document.createElement('input');
    input.type = 'file';
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: input });
    c.onFilesPicked(event);
  });

  it('startEdit/cancelEdit', () => {
    const c = fixture.componentInstance;
    c.startEdit({ id: 'c1', content: 'hi' } as never);
    c.cancelEdit();
  });

  it('onEditSubmit', () => {
    const c = fixture.componentInstance;
    c.startEdit({ id: 'c1', content: 'hi', authorId: 'u1' } as never);
    (c as unknown as { editModel: { set: (v: unknown) => void } }).editModel.set({ content: 'yo' });
    const event = new Event('submit');
    vi.spyOn(event, 'preventDefault');
    c.onEditSubmit(event, { id: 'c1', content: 'hi', authorId: 'u1' } as never);
  });

  it('onDelete', async () => {
    const c = fixture.componentInstance;
    c.onDelete({ id: 'c1', authorId: 'u1' } as never);
    await new Promise((r) => setTimeout(r, 0));
  });

  it('deleteAttachment', async () => {
    const c = fixture.componentInstance;
    c.onDeleteAttachment({ id: 'a1', uploadedById: 'u1' } as never, { id: 'c1' } as never);
    await new Promise((r) => setTimeout(r, 0));
  });

  it('onFilesPicked wrong type', () => {
    const c = fixture.componentInstance;
    const input = document.createElement('input');
    input.type = 'file';
    const file = new File(['x'], 'a.exe', { type: 'application/x-msdownload' });
    Object.defineProperty(input, 'files', { value: [file] });
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: input });
    c.onFilesPicked(event);
  });

  it('onCreateSubmit with pending files', () => {
    const c = fixture.componentInstance;
    (c as unknown as { createModel: { set: (v: unknown) => void } }).createModel.set({ content: 'hello' });
    (c as unknown as { pendingFiles: { set: (v: unknown) => void } }).pendingFiles.set([new File(['x'], 'a.txt', { type: 'text/plain' })]);
    const event = new Event('submit');
    vi.spyOn(event, 'preventDefault');
    c.onCreateSubmit(event);
  });
});
