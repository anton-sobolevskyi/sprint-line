import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { API_BASE_URL, API_ENDPOINTS } from '@constants/api';
import { Session } from '@core/services/session';
import { authFeature } from '../../store/auth/auth.reducer';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let session: {
    getAccessTokenSnapshot: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    session = {
      getAccessTokenSnapshot: vi.fn(() => 'tok-1'),
      refresh: vi.fn(() => of({ accessToken: 'tok-2' })),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideStore({ [authFeature.name]: authFeature.reducer }),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Session, useValue: session },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('adds Authorization and withCredentials on API requests', () => {
    http.get(`${API_BASE_URL}/projects`).subscribe();

    const req = httpMock.expectOne(`${API_BASE_URL}/projects`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-1');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });

  it('does not attach a bearer token on public auth endpoints', () => {
    session.getAccessTokenSnapshot.mockReturnValue('tok-1');
    http.post(API_ENDPOINTS.auth.login, {}).subscribe({
      error: () => undefined,
    });

    const req = httpMock.expectOne(API_ENDPOINTS.auth.login);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('refreshes and retries once on 401 for protected API calls', () => {
    http.get(`${API_BASE_URL}/projects`).subscribe();

    const first = httpMock.expectOne(`${API_BASE_URL}/projects`);
    first.flush('nope', { status: 401, statusText: 'Unauthorized' });

    expect(session.refresh).toHaveBeenCalled();

    const retry = httpMock.expectOne(`${API_BASE_URL}/projects`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer tok-2');
    retry.flush([]);
  });

  it('navigates to login when refresh fails for an authenticated session', () => {
    session.refresh.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/projects');

    http.get(`${API_BASE_URL}/projects`).subscribe({
      error: () => undefined,
    });

    httpMock.expectOne(`${API_BASE_URL}/projects`).flush('nope', {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(navigate).toHaveBeenCalled();
    const [commands, extras] = navigate.mock.calls[0]!;
    expect(commands).toEqual(['/login']);
    expect(extras?.queryParams?.['returnUrl']).toBe('/projects');
  });
});
