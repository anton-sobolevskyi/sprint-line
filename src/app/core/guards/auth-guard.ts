import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { map, take } from 'rxjs';
import { sanitizeReturnUrl } from '@utils';
import { RETURN_URL_PARAM } from '@constants/config';

export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }

      const returnUrl = sanitizeReturnUrl(state.url);
      return router.createUrlTree(['/login'], {
        queryParams: returnUrl ? { [RETURN_URL_PARAM]: returnUrl } : undefined,
      });
    }),
  );
};
