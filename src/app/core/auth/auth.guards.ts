import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';

import { selectIsAuthenticated } from './auth.selectors';

const LOGIN_PATH = '/login' as const;
const HOME_PATH = '/' as const;

/** Allows the route only when an access token is present in the global auth store. */
export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) =>
      isAuthenticated ? true : router.createUrlTree([LOGIN_PATH]),
    ),
  );
};

/** Redirects authenticated users away from login/register. */
export const guestGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) =>
      isAuthenticated ? router.createUrlTree([HOME_PATH]) : true,
    ),
  );
};
