import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type TaskResponseDto, TasksApiService } from '../../core/tasks/tasks-api.service';
import { ProjectTasksStore } from './project-tasks.store';

function task(id: string, status: TaskResponseDto['status'] = 'TODO'): TaskResponseDto {
  return { id, title: `Task ${id}`, status, priority: 'MEDIUM' } as TaskResponseDto;
}

function listResponse(tasks: TaskResponseDto[]) {
  return { data: tasks, meta: {} };
}

describe('ProjectTasksStore', () => {
  const api = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  };

  function createStore() {
    TestBed.configureTestingModule({
      providers: [ProjectTasksStore, { provide: TasksApiService, useValue: api }],
    });
    const store = TestBed.inject(ProjectTasksStore);
    store.setProjectId('p1');
    return store;
  }

  beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset());
  });

  it('loads tasks into columns', () => {
    api.findAll.mockReturnValue(of(listResponse([task('1'), task('2', 'DONE')])));
    const store = createStore();

    store.load();

    expect(store.loadStatus()).toBe('success');
    const todo = store.columns().find((column) => column.status === 'TODO');
    expect(todo?.tasks.map((item) => item.id)).toEqual(['1']);
  });

  it('reports load errors', () => {
    api.findAll.mockReturnValue(throwError(() => new Error('boom')));
    const store = createStore();

    store.load();

    expect(store.loadStatus()).toBe('error');
    expect(store.loadError()).toBeTruthy();
  });

  it('ignores a slow outdated response when a newer load was started', () => {
    const first = new Subject<ReturnType<typeof listResponse>>();
    const second = new Subject<ReturnType<typeof listResponse>>();
    api.findAll.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const store = createStore();

    store.load();
    store.load();
    second.next(listResponse([task('new')]));
    first.next(listResponse([task('old')]));

    expect(store.tasks().map((item) => item.id)).toEqual(['new']);
  });

  it('moves a created task to the requested status', () => {
    api.create.mockReturnValue(of(task('1', 'TODO')));
    api.update.mockReturnValue(of(task('1', 'IN_PROGRESS')));
    api.findAll.mockReturnValue(of(listResponse([task('1', 'IN_PROGRESS')])));
    const store = createStore();
    const onSuccess = vi.fn();

    store.create({ title: 'x', priority: 'MEDIUM' }, { onSuccess }, 'IN_PROGRESS');

    expect(api.update).toHaveBeenCalledWith('1', { status: 'IN_PROGRESS' });
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(store.tasks()[0]?.status).toBe('IN_PROGRESS');
  });

  it('reports a partial success when the follow-up status change fails', () => {
    api.create.mockReturnValue(of(task('1', 'TODO')));
    api.update.mockReturnValue(throwError(() => new Error('nope')));
    api.findAll.mockReturnValue(of(listResponse([task('1', 'TODO')])));
    const store = createStore();
    const onSuccess = vi.fn();
    const onPartialSuccess = vi.fn();

    store.create({ title: 'x', priority: 'MEDIUM' }, { onSuccess, onPartialSuccess }, 'DONE');

    expect(onPartialSuccess).toHaveBeenCalledOnce();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('surfaces silent refresh failures via actionError without hiding the board', () => {
    api.create.mockReturnValue(of(task('1', 'TODO')));
    api.findAll
      .mockReturnValueOnce(of(listResponse([task('1')])))
      .mockReturnValueOnce(throwError(() => new Error('offline')));
    const store = createStore();

    store.load();
    store.create({ title: 'x', priority: 'MEDIUM' });

    expect(store.loadStatus()).toBe('success');
    expect(store.actionError()).toBeTruthy();
  });

  it('rolls back an optimistic status change on error', () => {
    api.findAll.mockReturnValue(of(listResponse([task('1', 'TODO')])));
    api.update.mockReturnValue(throwError(() => new Error('nope')));
    const store = createStore();
    store.load();

    store.updateStatus(store.tasks()[0]!, 'DONE');

    expect(store.tasks()[0]?.status).toBe('TODO');
    expect(store.actionError()).toBeTruthy();
  });
});
