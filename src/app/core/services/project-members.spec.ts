import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { API_ENDPOINTS } from '@constants/api';
import { ProjectMembers } from './project-members';

describe('ProjectMembers', () => {
  let service: ProjectMembers;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ProjectMembers],
    });
    service = TestBed.inject(ProjectMembers);
    http = TestBed.inject(HttpTestingController);
  });

  it('findAll', () => {
    service.findAll('p1', { page: 1, limit: 10 }).subscribe();
    const req = http.expectOne((r) => r.url === API_ENDPOINTS.projects.members('p1'));
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: { total: 0 } });
  });

  it('add', () => {
    service.add('p1', { email: 'a@b.co', role: 'MEMBER' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.projects.members('p1'));
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'm1' });
  });

  it('updateRole', () => {
    service.updateRole('p1', 'u1', { role: 'ADMIN' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.projects.member('p1', 'u1'));
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 'm1' });
  });

  it('remove', () => {
    service.remove('p1', 'u1').subscribe();
    const req = http.expectOne(API_ENDPOINTS.projects.member('p1', 'u1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 'm1' });
  });

  it('transferOwnership', () => {
    service.transferOwnership('p1', 'u1').subscribe();
    const req = http.expectOne(API_ENDPOINTS.projects.transferOwnership('p1', 'u1'));
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'm1' });
  });
});
