import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProjectMembers } from '@core/services/project-members';
import { ProjectMembersStore } from './project-members.store';

describe('ProjectMembersStore', () => {
  let store: InstanceType<typeof ProjectMembersStore>;
  const api = {
    findAll: vi.fn(() => of({ data: [], meta: { total: 0 } })),
    add: vi.fn(() => of({ id: 'm1' })),
    updateRole: vi.fn(() => of({ id: 'm1' })),
    remove: vi.fn(() => of({ id: 'm1' })),
    transferOwnership: vi.fn(() => of({ id: 'm1' })),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectMembers, useValue: api },
        ProjectMembersStore,
      ],
    });
    store = TestBed.inject(ProjectMembersStore);
    api.findAll.mockClear();
    api.add.mockClear();
    api.updateRole.mockClear();
    api.remove.mockClear();
    api.transferOwnership.mockClear();
    api.findAll.mockReturnValue(of({ data: [], meta: { total: 0 } }));
    api.add.mockReturnValue(of({ id: 'm1' }));
    api.updateRole.mockReturnValue(of({ id: 'm1' }));
    api.remove.mockReturnValue(of({ id: 'm1' }));
    api.transferOwnership.mockReturnValue(of({ id: 'm1' }));
  });

  it('setProjectId and load', async () => {
    store.setProjectId('p1');
    store.load();
    await new Promise((r) => setTimeout(r, 0));
    expect(store.loadStatus()).toBe('success');
  });

  it('load with no projectId returns', () => {
    store.load();
    expect(store.loadStatus()).toBe('idle');
  });

  it('setProjectId same id returns', () => {
    store.setProjectId('p1');
    store.setProjectId('p1');
    expect(store.projectId()).toBe('p1');
  });

  it('invite', async () => {
    store.setProjectId('p1');
    let success = false;
    store.invite({ email: 'a@b.co', role: 'MEMBER' }, { onSuccess: () => (success = true) });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(success).toBe(true);
  });

  it('invite error', async () => {
    api.add.mockReturnValueOnce(throwError(() => new Error('boom')));
    store.setProjectId('p1');
    let err: string | null = null;
    store.invite({ email: 'a@b.co', role: 'MEMBER' }, { onError: (m) => (err = m) });
    await new Promise((r) => setTimeout(r, 0));
    expect(err).toBeTruthy();
  });

  it('updateRole', async () => {
    store.setProjectId('p1');
    store.updateRole({ userId: 'u1', role: 'MEMBER' } as never, 'ADMIN');
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(store.actionUserId()).toBeNull();
  });

  it('updateRole same role returns', () => {
    store.setProjectId('p1');
    store.updateRole({ userId: 'u1', role: 'ADMIN' } as never, 'ADMIN');
    expect(api.updateRole).not.toHaveBeenCalled();
  });

  it('remove', async () => {
    store.setProjectId('p1');
    let success = false;
    store.remove('u1', { onSuccess: () => (success = true) });
    await new Promise((r) => setTimeout(r, 0));
    expect(success).toBe(true);
  });

  it('remove error', async () => {
    api.remove.mockReturnValueOnce(throwError(() => new Error('boom')));
    store.setProjectId('p1');
    let err: string | null = null;
    store.remove('u1', { onError: (m) => (err = m) });
    await new Promise((r) => setTimeout(r, 0));
    expect(err).toBeTruthy();
  });

  it('transferOwnership', async () => {
    store.setProjectId('p1');
    let success = false;
    store.transferOwnership('u1', { onSuccess: () => (success = true) });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    expect(success).toBe(true);
  });

  it('transferOwnership error', async () => {
    api.transferOwnership.mockReturnValueOnce(throwError(() => new Error('boom')));
    store.setProjectId('p1');
    let err: string | null = null;
    store.transferOwnership('u1', { onError: (m) => (err = m) });
    await new Promise((r) => setTimeout(r, 0));
    expect(err).toBeTruthy();
  });
});