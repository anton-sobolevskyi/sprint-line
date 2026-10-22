import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { AuthActions } from './auth.actions';
import { authGuard, guestGuard } from './auth.guards';
import { authFeature } from './auth.reducer';

describe('auth guards', () => {
  it('authGuard redirects guests to login', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideStore({ [authFeature.name]: authFeature.reducer }),
      ],
    });

    const result = await firstValueFrom(TestBed.runInInjectionContext(() => authGuard({} as never, {} as never)) as ReturnType<typeof authGuard> extends boolean ? never : ReturnType<typeof authGuard>);

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

    const store = TestBed.inject(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (await import('@ngrx/store')).Store as any,
    );
    store.dispatch(AuthActions.setAccessToken({ accessToken: 'token' }));

    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never)) as Exclude<
        ReturnType<typeof guestGuard>,
        boolean | import('@angular/router').UrlTree
      >,
    );

    const router = TestBed.inject(Router);
    expect(result).toEqual(router.createUrlTree(['/']));
  });
});
