import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';

import { AuthApiService } from '../../core/auth/auth-api.service';
import { AUTH_MESSAGES } from '../auth/auth.messages';

@Component({
  selector: 'sl-home-page',
  imports: [RouterLink, ...HlmButtonImports, ...HlmCardImports],
  templateUrl: './home.page.html',
})
export class HomePage {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  readonly messages = AUTH_MESSAGES;
  readonly isLoggingOut = signal(false);

  logout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.authApi.logout().subscribe({
      next: () => {
        this.isLoggingOut.set(false);
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.isLoggingOut.set(false);
        void this.router.navigateByUrl('/login');
      },
    });
  }
}
