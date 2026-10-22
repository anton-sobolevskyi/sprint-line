import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { firstValueFrom, isObservable } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { AuthActions } from './auth.actions';
import { authGuard, guestGuard } from './auth.guards';
import { authFeature } from './auth.reducer';

async function resolveGuardResult(
  result: ReturnType<typeof authGuard>,
): Promise<boolean | ReturnType<Router['createUrlTree']>> {
  if (isObservable(result)) {
    return firstValueFrom(result);
  }
  return result as boolean | ReturnType<Router['createUrlTree']>;
}

describe('auth guards', () => {
  it('authGuard redirects guests to login', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideStore({ [authFeature.name]: authFeature.reducer }),
      ],
    });

    const result = await resolveGuardResult(
      TestBed.runInInjectionContext(() => authGuard({} as never, {} as never)),
    );

    const router = TestBed.inject(Router);
    expect(result).toEqual(router.createUrlTree(['/login']));
  });

  it('guestGuard redirects authenticated users home', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideStore({ [authFeature.name]: authFeature.reducer }),
      ],
    });

    TestBed.inject(Store).dispatch(
      AuthActions.setAccessToken({ accessToken: 'token' }),
    );

    const result = await resolveGuardResult(
      TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never)),
    );

    const router = TestBed.inject(Router);
    expect(result).toEqual(router.createUrlTree(['/']));
  });
});
