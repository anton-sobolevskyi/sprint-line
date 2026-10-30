import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngrx/store';
import { beforeEach, describe, expect, it } from 'vitest';

import { API_ENDPOINTS } from '@constants/api';
import { authFeature } from '../../store/auth/auth.reducer';
import { selectAccessToken } from '../../store/auth/auth.selectors';
import { Session } from './session';

describe('Session', () => {
  let session: Session;
  let http: HttpTestingController;
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore({ [authFeature.name]: authFeature.reducer }),
        Session,
      ],
    });
    session = TestBed.inject(Session);
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(Store);
  });

  it('applyAuthResponse stores the access token', () => {
    session.applyAuthResponse({ accessToken: 'tok-1' } as never);
    expect(session.getAccessTokenSnapshot()).toBe('tok-1');
    expect(store.selectSignal(selectAccessToken)()).toBe('tok-1');
  });

  it('clearSession removes the token', () => {
    session.applyAuthResponse({ accessToken: 'tok-1' } as never);
    session.clearSession();
    expect(session.getAccessTokenSnapshot()).toBeNull();
  });

  it('refresh posts with credentials and applies the response', () => {
    const sub = session.refresh().subscribe();

    const req = http.expectOne(API_ENDPOINTS.auth.refresh);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ accessToken: 'refreshed' });

    expect(session.getAccessTokenSnapshot()).toBe('refreshed');
    sub.unsubscribe();
  });

  it('coalesces concurrent refresh calls into one HTTP request', () => {
    const a = session.refresh().subscribe();
    const b = session.refresh().subscribe();

    const requests = http.match(API_ENDPOINTS.auth.refresh);
    expect(requests).toHaveLength(1);
    requests[0].flush({ accessToken: 'once' });

    expect(session.getAccessTokenSnapshot()).toBe('once');
    a.unsubscribe();
    b.unsubscribe();
  });

  it('clears the session when refresh fails', () => {
    session.applyAuthResponse({ accessToken: 'old' } as never);
    const sub = session.refresh().subscribe({
      error: () => undefined,
    });

    http.expectOne(API_ENDPOINTS.auth.refresh).flush('nope', {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(session.getAccessTokenSnapshot()).toBeNull();
    sub.unsubscribe();
  });
});
