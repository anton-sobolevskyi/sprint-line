import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { map, take } from 'rxjs';
import { sanitizeReturnUrl } from '../../utils/route.utils';
import { RETURN_URL_PARAM } from '@constants/config';

const LOGIN_PATH = '/login' as const;

export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  const returnUrl = sanitizeReturnUrl(state?.url);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) =>
      isAuthenticated
        ? true
        : router.createUrlTree(
            [LOGIN_PATH],
            returnUrl ? { queryParams: { [RETURN_URL_PARAM]: returnUrl } } : undefined
          )
    )
  );
};
