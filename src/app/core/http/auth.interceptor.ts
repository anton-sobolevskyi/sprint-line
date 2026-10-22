import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AccessTokenStore } from '../auth/access-token.store';
import { AuthSessionService } from '../auth/auth-session.service';

const AUTH_PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
] as const;

function isApiRequest(url: string): boolean {
  return url.startsWith(environment.apiUrl);
}

function isAuthPublicRequest(url: string): boolean {
  return AUTH_PUBLIC_PATHS.some((path) => url.includes(path));
}

function withAccessToken(
  req: HttpRequest<unknown>,
  token: string | null,
): HttpRequest<unknown> {
  let next = req;

  // Refresh cookie must be sent cross-origin for /auth/* and any future cookie use.
  if (isApiRequest(req.url) && !req.withCredentials) {
    next = next.clone({ withCredentials: true });
  }

  if (token && isApiRequest(req.url) && !isAuthPublicRequest(req.url)) {
    next = next.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next;
}

/**
 * Attaches Bearer access token, enables credentials for API calls,
 * and on 401 performs a single serialized refresh then retries once.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const accessTokenStore = inject(AccessTokenStore);
  const authSession = inject(AuthSessionService);

  const token = accessTokenStore.getSnapshot();
  const authorizedReq = withAccessToken(req, token);

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Do not attempt refresh for public auth endpoints or non-API calls.
      if (!isApiRequest(req.url) || isAuthPublicRequest(req.url)) {
        return throwError(() => error);
      }

      return authSession.refresh().pipe(
        switchMap((response) => {
          const retryReq = withAccessToken(req, response.accessToken);
          return next(retryReq);
        }),
        catchError((refreshError: unknown) => throwError(() => refreshError)),
      );
    }),
  );
};
