import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';

import { routes } from './app.routes';
import { authFeature } from './store/auth/auth.reducer';
import { UserEffects } from './core/users/user.effects';
import { userFeature } from './core/users/user.reducer';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { Session } from '@core/services/session';
import { firstValueFrom } from 'rxjs';
import { Theme } from '@core/services/theme';
import { hideBootLoader } from '@utils';
import { provideHlmSidebarConfig } from '@spartan-ng/helm/sidebar';

export function restoreAuthSession(): Promise<void> {
  const authSession = inject(Session);

  return firstValueFrom(authSession.refresh())
    .then(
      () => undefined,
      () => undefined
    )
    .finally(() => {
      hideBootLoader();
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Match Tailwind's `md` (768px): the sidebar library switches to its sheet at <=768px,
    // while the CSS shows the desktop sidebar from >=768px, so exactly 768px (iPad portrait) matched both.
    provideHlmSidebarConfig({
      mobileBreakpoint: '767px',
      closeMobileSidebarOnMenuButtonClick: true,
    }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      [authFeature.name]: authFeature.reducer,
      [userFeature.name]: userFeature.reducer,
    }),
    provideEffects([UserEffects]),
    provideRouterStore(),
    provideAppInitializer(restoreAuthSession),
    provideAppInitializer(() => {
      inject(Theme);
    }),
  ],
};
