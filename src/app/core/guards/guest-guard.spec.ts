import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { firstValueFrom, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthActions } from '../../store/auth/auth.actions';
import { authFeature } from '../../store/auth/auth.reducer';
import { guestGuard } from './guest-guard';

describe('guestGuard', () => {
  let store: Store;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideStore({ [authFeature.name]: authFeature.reducer })],
    });
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
  });

  async function run(): Promise<boolean | UrlTree> {
    return firstValueFrom(
      TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never) as Observable<
        boolean | UrlTree
      >)
    );
  }

  it('allows anonymous users', async () => {
    await expect(run()).resolves.toBe(true);
  });

  it('sends authenticated users home', async () => {
    store.dispatch(AuthActions.setAccessToken({ accessToken: 'tok' }));
    const result = await run();
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
