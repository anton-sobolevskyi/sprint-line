import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { API_ENDPOINTS } from '@constants/api';
import { Attachments } from './attachments';

describe('Attachments', () => {
  let service: Attachments;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), Attachments],
    });
    service = TestBed.inject(Attachments);
    http = TestBed.inject(HttpTestingController);
  });

  it('findAllForTask', () => {
    service.findAllForTask('t1').subscribe();
    const req = http.expectOne(API_ENDPOINTS.tasks.attachments('t1'));
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('uploadForTask', () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    service.uploadForTask('t1', file).subscribe();
    const req = http.expectOne(API_ENDPOINTS.tasks.attachments('t1'));
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'a1' });
  });

  it('uploadForComment', () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    service.uploadForComment('c1', file).subscribe();
    const req = http.expectOne(API_ENDPOINTS.comments.attachments('c1'));
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'a1' });
  });

  it('getDownloadUrl', () => {
    service.getDownloadUrl('a1').subscribe();
    const req = http.expectOne(API_ENDPOINTS.attachments.downloadUrl('a1'));
    expect(req.request.method).toBe('GET');
    req.flush({ url: 'http://x' });
  });

  it('remove', () => {
    service.remove('a1').subscribe();
    const req = http.expectOne(API_ENDPOINTS.attachments.byId('a1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 'a1' });
  });
});
