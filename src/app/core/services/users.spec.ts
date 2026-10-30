import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { API_ENDPOINTS } from '@constants/api';
import { Users } from './users';

describe('Users', () => {
  let service: Users;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), Users],
    });
    service = TestBed.inject(Users);
    http = TestBed.inject(HttpTestingController);
  });

  it('getMe', () => {
    service.getMe().subscribe();
    const req = http.expectOne(API_ENDPOINTS.users.me);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 'u1' });
  });

  it('updateMe', () => {
    service.updateMe({ name: 'Ada' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.users.me);
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 'u1' });
  });

  it('changePassword', () => {
    service.changePassword({ currentPassword: 'old', newPassword: 'New1' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.users.mePassword);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('deleteMe', () => {
    service.deleteMe({ currentPassword: 'old' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.users.me);
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 'u1' });
  });

  it('uploadAvatar', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    service.uploadAvatar(file).subscribe();
    const req = http.expectOne(API_ENDPOINTS.users.avatar);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'att1' });
  });

  it('getAttachmentDownloadUrl', () => {
    service.getAttachmentDownloadUrl('a1').subscribe();
    const req = http.expectOne(API_ENDPOINTS.attachments.downloadUrl('a1'));
    expect(req.request.method).toBe('GET');
    req.flush({ url: 'http://x' });
  });
});
