import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { API_ENDPOINTS } from '@constants/api';
import { Projects } from './projects';

describe('Projects', () => {
  let service: Projects;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), Projects],
    });
    service = TestBed.inject(Projects);
    http = TestBed.inject(HttpTestingController);
  });

  it('findAll sends page and limit query params', () => {
    service.findAll({ page: 2, limit: 10 }).subscribe();

    const req = http.expectOne(
      (r) => r.url === API_ENDPOINTS.projects.list && r.params.get('page') === '2'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ data: [], meta: { total: 0 } });
  });

  it('create posts the dto', () => {
    const dto = { name: 'Alpha' };
    service.create(dto as never).subscribe();

    const req = http.expectOne(API_ENDPOINTS.projects.create);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ id: '1', name: 'Alpha' });
  });

  it('findOne gets by id', () => {
    service.findOne('p1').subscribe();

    const req = http.expectOne(API_ENDPOINTS.projects.byId('p1'));
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'p1', name: 'Alpha' });
  });

  it('update patches by id', () => {
    service.update('p1', { name: 'Beta' } as never).subscribe();

    const req = http.expectOne(API_ENDPOINTS.projects.byId('p1'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Beta' });
    req.flush({ id: 'p1', name: 'Beta' });
  });

  it('softDelete deletes by id', () => {
    service.softDelete('p1').subscribe();

    const req = http.expectOne(API_ENDPOINTS.projects.byId('p1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 'p1' });
  });
});
