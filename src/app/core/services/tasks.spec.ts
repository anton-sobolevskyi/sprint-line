import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { API_ENDPOINTS } from '@constants/api';
import { Tasks } from './tasks';

describe('Tasks', () => {
  let service: Tasks;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), Tasks],
    });
    service = TestBed.inject(Tasks);
    http = TestBed.inject(HttpTestingController);
  });

  it('findAll builds filter query params', () => {
    service
      .findAll('proj-1', { page: 1, limit: 20, status: 'TODO', q: 'board' })
      .subscribe();

    const req = http.expectOne((r) => r.url === API_ENDPOINTS.projects.tasks('proj-1'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('status')).toBe('TODO');
    expect(req.request.params.get('q')).toBe('board');
    req.flush({ data: [], meta: { total: 0 } });
  });

  it('findMine hits users me tasks endpoint', () => {
    service.findMine({ page: 1, limit: 5, includeDone: true }).subscribe();

    const req = http.expectOne((r) => r.url === API_ENDPOINTS.users.meTasks);
    expect(req.request.params.get('includeDone')).toBe('true');
    req.flush({ data: [], meta: { total: 0 } });
  });

  it('create posts under the project tasks collection', () => {
    const dto = { title: 'Ship it', priority: 'HIGH' };
    service.create('proj-1', dto as never).subscribe();

    const req = http.expectOne(API_ENDPOINTS.projects.tasks('proj-1'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ id: 't1', ...dto });
  });

  it('update and softDelete target task by id', () => {
    service.update('t1', { status: 'DONE' } as never).subscribe();
    const patch = http.expectOne(API_ENDPOINTS.tasks.byId('t1'));
    expect(patch.request.method).toBe('PATCH');
    patch.flush({ id: 't1', status: 'DONE' });

    service.softDelete('t1').subscribe();
    const del = http.expectOne(API_ENDPOINTS.tasks.byId('t1'));
    expect(del.request.method).toBe('DELETE');
    del.flush({ id: 't1' });
  });
});
