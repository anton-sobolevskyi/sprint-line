import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { API_ENDPOINTS } from '@constants/api';
import { Comments } from './comments';

describe('Comments', () => {
  let service: Comments;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), Comments],
    });
    service = TestBed.inject(Comments);
    http = TestBed.inject(HttpTestingController);
  });

  it('findAll', () => {
    service.findAll('t1', { page: 2, limit: 5 }).subscribe();
    const req = http.expectOne((r) => r.url === API_ENDPOINTS.tasks.comments('t1'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: { total: 0 } });
  });

  it('create', () => {
    service.create('t1', { content: 'hi' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.tasks.comments('t1'));
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'c1' });
  });

  it('findOne', () => {
    service.findOne('c1').subscribe();
    const req = http.expectOne(API_ENDPOINTS.comments.byId('c1'));
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'c1' });
  });

  it('update', () => {
    service.update('c1', { content: 'yo' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.comments.byId('c1'));
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 'c1' });
  });

  it('softDelete', () => {
    service.softDelete('c1').subscribe();
    const req = http.expectOne(API_ENDPOINTS.comments.byId('c1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 'c1' });
  });
});
