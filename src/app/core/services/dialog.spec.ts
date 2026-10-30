import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { Dialog } from './dialog';

describe('Dialog', () => {
  const closed$ = of(true);
  const hlmDialog = {
    open: vi.fn(() => ({ closed$ })),
  };

  beforeEach(() => {
    hlmDialog.open.mockClear();
    TestBed.configureTestingModule({
      providers: [Dialog, { provide: HlmDialogService, useValue: hlmDialog }],
    });
  });

  it('should be created', () => {
    expect(TestBed.inject(Dialog)).toBeTruthy();
  });

  it('confirm opens the dialog and resolves true when closed with true', async () => {
    const dialog = TestBed.inject(Dialog);
    await expect(
      dialog.confirm({ title: 'Delete?', description: 'Sure?' })
    ).resolves.toBe(true);
    expect(hlmDialog.open).toHaveBeenCalledOnce();
  });
});
