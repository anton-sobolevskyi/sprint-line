import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import {
  isApiRequestUrl,
  isAuthPublicRequestUrl,
} from '../api/api-endpoints';
import { AuthSessionService } from '../auth/auth-session.service';

function withAccessToken(
  req: HttpRequest<unknown>,
  token: string | null,
): HttpRequest<unknown> {
  let next = req;

  if (isApiRequestUrl(req.url) && !req.withCredentials) {
    next = next.clone({ withCredentials: true });
  }

  if (token && isApiRequestUrl(req.url) && !isAuthPublicRequestUrl(req.url)) {
    next = next.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next;
}

/**
 * Attaches Bearer access token from the global NgRx auth store,
 * enables credentials for API calls, and on 401 performs a single
 * serialized refresh then retries once.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(AuthSessionService);
  const token = authSession.getAccessTokenSnapshot();
  const authorizedReq = withAccessToken(req, token);

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (!isApiRequestUrl(req.url) || isAuthPublicRequestUrl(req.url)) {
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
