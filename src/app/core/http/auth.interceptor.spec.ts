import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { API_BASE_URL, API_ENDPOINTS, isAuthPublicRequestUrl } from '../api/api-endpoints';
import { AuthActions } from '../auth/auth.actions';
import { authFeature } from '../auth/auth.reducer';
import { authInterceptor } from './auth.interceptor';

const PROJECTS_URL = `${API_BASE_URL}/projects`;

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let store: Store;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideStore({ [authFeature.name]: authFeature.reducer }),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpMock.verify());

  it('adds the bearer token and credentials to API requests', () => {
    store.dispatch(AuthActions.setAccessToken({ accessToken: 'abc' }));

    http.get(PROJECTS_URL).subscribe();

    const req = httpMock.expectOne(PROJECTS_URL);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('does not attach the token to non-API URLs', () => {
    store.dispatch(AuthActions.setAccessToken({ accessToken: 'abc' }));

    http.get('https://other.example.com/data').subscribe();

    const req = httpMock.expectOne('https://other.example.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('refreshes once on 401 and retries with the new token', () => {
    store.dispatch(AuthActions.setAccessToken({ accessToken: 'old' }));
    let result: unknown;

    http.get(PROJECTS_URL).subscribe((value) => (result = value));

    httpMock.expectOne(PROJECTS_URL).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(API_ENDPOINTS.auth.refresh).flush({ accessToken: 'new' });

    const retry = httpMock.expectOne(PROJECTS_URL);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
    retry.flush({ ok: true });

    expect(result).toEqual({ ok: true });
  });

  it('shares a single refresh between concurrent 401s', () => {
    store.dispatch(AuthActions.setAccessToken({ accessToken: 'old' }));

    http.get(`${PROJECTS_URL}/1`).subscribe();
    http.get(`${PROJECTS_URL}/2`).subscribe();

    httpMock.expectOne(`${PROJECTS_URL}/1`).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(`${PROJECTS_URL}/2`).flush({}, { status: 401, statusText: 'Unauthorized' });

    const refreshes = httpMock.match(API_ENDPOINTS.auth.refresh);
    expect(refreshes).toHaveLength(1);
    refreshes[0]?.flush({ accessToken: 'new' });

    httpMock.expectOne(`${PROJECTS_URL}/1`).flush({});
    httpMock.expectOne(`${PROJECTS_URL}/2`).flush({});
  });

  it('redirects to login with returnUrl when the refresh fails', async () => {
    await router.navigateByUrl('/projects/42?tab=members');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    store.dispatch(AuthActions.setAccessToken({ accessToken: 'old' }));
    let failed = false;

    http.get(PROJECTS_URL).subscribe({ error: () => (failed = true) });

    httpMock.expectOne(PROJECTS_URL).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne(API_ENDPOINTS.auth.refresh)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/projects/42?tab=members' },
    });
  });

  it('does not redirect when there was no session to begin with', async () => {
    await router.navigateByUrl('/projects');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    http.get(PROJECTS_URL).subscribe({ error: () => undefined });

    httpMock.expectOne(PROJECTS_URL).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock
      .expectOne(API_ENDPOINTS.auth.refresh)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not retry public auth endpoints on 401', () => {
    let failed = false;

    http.post(API_ENDPOINTS.auth.login, {}).subscribe({ error: () => (failed = true) });

    httpMock
      .expectOne(API_ENDPOINTS.auth.login)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    httpMock.expectNone(API_ENDPOINTS.auth.refresh);
    expect(failed).toBe(true);
  });
});

describe('isAuthPublicRequestUrl', () => {
  it('matches exact auth paths, ignoring the query string', () => {
    expect(isAuthPublicRequestUrl(API_ENDPOINTS.auth.login)).toBe(true);
    expect(isAuthPublicRequestUrl(`${API_ENDPOINTS.auth.verifyEmail}?token=x`)).toBe(true);
  });

  it('does not match lookalike paths or foreign hosts', () => {
    expect(isAuthPublicRequestUrl(`${API_BASE_URL}/projects/auth/login`)).toBe(false);
    expect(isAuthPublicRequestUrl(API_ENDPOINTS.auth.resendVerification)).toBe(false);
    expect(isAuthPublicRequestUrl('https://other.example.com/auth/login')).toBe(false);
  });
});
