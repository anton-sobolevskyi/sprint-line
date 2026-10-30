import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { beforeEach, describe, expect, it } from 'vitest';

import { authFeature } from '../../store/auth/auth.reducer';
import { API_ENDPOINTS } from '@constants/api';
import { Auth } from './auth';
import { Session } from './session';

describe('Auth', () => {
  let service: Auth;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore({ [authFeature.name]: authFeature.reducer }),
        Session,
        Auth,
      ],
    });
    service = TestBed.inject(Auth);
    http = TestBed.inject(HttpTestingController);
  });

  it('register', () => {
    service.register({ email: 'a@b.co' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.auth.register);
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 't' });
  });

  it('login', () => {
    service.login({ email: 'a@b.co' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.auth.login);
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 't' });
  });

  it('logout', () => {
    service.logout().subscribe();
    const req = http.expectOne(API_ENDPOINTS.auth.logout);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('refresh delegates to session', () => {
    // session.refresh makes HTTP call
    service.refresh().subscribe({ error: () => undefined });
    const req = http.expectOne(API_ENDPOINTS.auth.refresh);
    expect(req.request.method).toBe('POST');
    req.flush({ accessToken: 't' });
  });

  it('forgotPassword', () => {
    service.forgotPassword({ email: 'a@b.co' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.auth.forgotPassword);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('resetPassword', () => {
    service.resetPassword({ token: 'x', password: 'P1' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.auth.resetPassword);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('verifyEmail', () => {
    service.verifyEmail({ token: 'x' } as never).subscribe();
    const req = http.expectOne(API_ENDPOINTS.auth.verifyEmail);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('resendVerification', () => {
    service.resendVerification().subscribe();
    const req = http.expectOne(API_ENDPOINTS.auth.resendVerification);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
