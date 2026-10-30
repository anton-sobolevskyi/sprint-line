import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { authFeature } from '../../../store/auth/auth.reducer';
import { userFeature } from '../../../core/users/user.reducer';
import { UserActions } from '../../../core/users/user.actions';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Attachments } from '@core/services/attachments';
import { Dialog } from '@core/services/dialog';
import { TaskAttachments } from './task-attachments';

describe('TaskAttachments', () => {
  let fixture: ComponentFixture<TaskAttachments>;
  const attachmentsApi = {
    findAllForTask: vi.fn(() => of([])),
    uploadForTask: vi.fn(() => of({ id: 'a1' })),
    getDownloadUrl: vi.fn(() => of({ url: 'http://x' })),
    remove: vi.fn(() => of({ id: 'a1' })),
  };
  const dialog = { confirm: vi.fn(() => of(true)) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskAttachments],
      providers: [
        provideStore({ [authFeature.name]: authFeature.reducer, [userFeature.name]: userFeature.reducer }),
        { provide: Attachments, useValue: attachmentsApi },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();

    const store = TestBed.inject(Store);
    store.dispatch(UserActions.setCurrentUser({ user: { id: 'u1', name: 'Ada', email: 'a@b.co' } as never }));

    fixture = TestBed.createComponent(TaskAttachments);
    fixture.componentRef.setInput('taskId', 't1');
    fixture.detectChanges();
  });

  it('loads', () => {
    expect(attachmentsApi.findAllForTask).toHaveBeenCalled();
  });

  it('utility methods', () => {
    const c = fixture.componentInstance;
    c.sizeLabel(1024);
    c.canDelete({ uploadedById: 'u1' } as never);
  });

  it('onFileSelected', () => {
    const c = fixture.componentInstance;
    const input = document.createElement('input');
    input.type = 'file';
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [file] });
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: input });
    c.onFileSelected(event);
  });

  it('onDownload', () => {
    const c = fixture.componentInstance;
    c.onDownload({ id: 'a1' } as never);
    expect(attachmentsApi.getDownloadUrl).toHaveBeenCalled();
  });
});
