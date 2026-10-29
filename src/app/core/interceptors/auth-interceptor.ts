import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { isGuestUrl, RETURN_URL_PARAM, sanitizeReturnUrl } from '../auth/return-url';
import { Session } from '@core/services/session';
import { isApiRequestUrl, isAuthPublicRequestUrl } from '@utils';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(Session);
  const router = inject(Router);
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
        catchError((refreshError: unknown) => {
          if (token && !isGuestUrl(router.url)) {
            const returnUrl = sanitizeReturnUrl(router.url);
            void router.navigate(['/login'], {
              queryParams: returnUrl ? { [RETURN_URL_PARAM]: returnUrl } : undefined,
            });
          }
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function withAccessToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
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
