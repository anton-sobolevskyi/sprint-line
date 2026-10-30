import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { AuthActions } from '../../store/auth/auth.actions';
import { authFeature } from '../../store/auth/auth.reducer';
import { authGuard } from './auth-guard';

describe('authGuard', () => {
  let store: Store;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideStore({ [authFeature.name]: authFeature.reducer })],
    });
    store = TestBed.inject(Store);
    router = TestBed.inject(Router);
  });

  async function run(url = '/projects'): Promise<boolean | UrlTree> {
    return firstValueFrom(
      TestBed.runInInjectionContext(() =>
        authGuard({} as never, { url } as never) as import('rxjs').Observable<boolean | UrlTree>
      )
    );
  }

  it('allows navigation when authenticated', async () => {
    store.dispatch(AuthActions.setAccessToken({ accessToken: 'tok' }));
    await expect(run()).resolves.toBe(true);
  });

  it('redirects to login with returnUrl when anonymous', async () => {
    const result = await run('/projects/42');
    expect(result instanceof UrlTree).toBe(true);
    const tree = result as UrlTree;
    expect(router.serializeUrl(tree)).toContain('/login');
    expect(tree.queryParams['returnUrl']).toBe('/projects/42');
  });
});
