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
import { restoreAuthSession } from './core/auth/auth-initializer';
import { authFeature } from './core/auth/auth.reducer';
import { authInterceptor } from './core/http/auth.interceptor';
import { ThemeService } from './core/ui/theme.service';
import { UserEffects } from './core/users/user.effects';
import { userFeature } from './core/users/user.reducer';

function initTheme(): void {
  // Instantiate so preference is applied before first paint of authenticated shell.
  inject(ThemeService);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore({
      [authFeature.name]: authFeature.reducer,
      [userFeature.name]: userFeature.reducer,
    }),
    provideEffects([UserEffects]),
    provideRouterStore(),
    provideAppInitializer(restoreAuthSession),
    provideAppInitializer(initTheme),
  ],
};
